import { supabase } from "../supabaseClient";
import {
  fetchAPI,
  fetchIdMap,
  toNumber,
  upsertRows,
  chunkArray,
} from "../f1ApiClient";
import { buildDriverRows } from "./importDrivers";
import { buildConstructorRows } from "./importConstructors";
import { importStandings } from "./importStandings";

const dedupeByKey = (rows, keyFn) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = keyFn(row);
    if (!key || map.has(key)) return;
    map.set(key, row);
  });
  return Array.from(map.values());
};

export async function importSeason(year, options = {}) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }
  const {
    includeQualifying = true,
    includePitStops = true,
    onProgress,
    onLog,
    shouldAbort,
  } = options;

  const log = (message) => {
    if (onLog) onLog(message);
    console.log(message);
  };

  const progress = (stage, percent) => {
    if (onProgress) onProgress(stage, percent);
  };

  const checkAbort = () => {
    if (shouldAbort?.()) {
      throw new Error("cancelled");
    }
  };

  checkAbort();
  progress("Fetching schedule", 5);
  const scheduleData = await fetchAPI(`${year}.json?limit=1000`, {
    onRequest: (url) => log(`Endpoint: ${url}`),
  });
  const races = scheduleData?.MRData?.RaceTable?.Races || [];
  log(`Race count: ${races.length}`);
  if (!races.length) {
    throw new Error("No race data returned");
  }

  await upsertRows("seasons", [{ year: toNumber(year), url: null }], "year");

  progress("Importing circuits", 15);
  const circuitRows = dedupeByKey(
    races.map((race) => {
      const circuit = race.Circuit;
      return {
        circuit_id: circuit?.circuitId,
        name: circuit?.circuitName,
        locality: circuit?.Location?.locality || null,
        country: circuit?.Location?.country || null,
        lat: toNumber(circuit?.Location?.lat),
        lng: toNumber(circuit?.Location?.long),
        url: circuit?.url || null,
        map_url: null,
        image_url: null,
      };
    }),
    (row) => row.circuit_id
  );
  await upsertRows("circuits", circuitRows, "circuit_id");
  const circuitIdMap = await fetchIdMap(
    "circuits",
    "circuit_id",
    circuitRows.map((row) => row.circuit_id)
  );

  progress("Importing races", 25);
  const raceRows = races.map((race) => ({
    race_id: `${race.season}-${race.round}`,
    season_year: toNumber(race.season),
    round: toNumber(race.round),
    circuit_id: circuitIdMap.get(race.Circuit?.circuitId) || null,
    name: race.raceName,
    date: race.date || null,
    time: race.time || null,
    url: race.url || null,
  }));
  await upsertRows("races", raceRows, "race_id");
  const raceIdMap = await fetchIdMap(
    "races",
    "race_id",
    raceRows.map((row) => row.race_id)
  );

  const rounds = raceRows.map((row) => row.round).filter(Boolean);

  for (let index = 0; index < rounds.length; index += 1) {
    const round = rounds[index];
    checkAbort();
    const percent = 25 + Math.round(((index + 1) / rounds.length) * 50);
    progress(`Importing results (Round ${round})`, percent);

    let resultsData;
    try {
      resultsData = await fetchAPI(`${year}/${round}/results.json?limit=1000`, {
        onRequest: (url) => log(`Endpoint: ${url}`),
      });
    } catch (error) {
      log(`Round ${round}: results fetch failed (${error.message}). Skipping.`);
      continue;
    }

    const resultRows = resultsData?.MRData?.RaceTable?.Races?.[0]?.Results || [];
    log(`Results count (round ${round}): ${resultRows.length}`);
    if (!resultRows.length) {
      log(`Round ${round}: no results returned. Skipping.`);
      continue;
    }

    const drivers = buildDriverRows(resultRows);
    const constructors = buildConstructorRows(resultRows);
    await upsertRows("drivers", drivers, "driver_id");
    await upsertRows("constructors", constructors, "constructor_id");

    const driverIdMap = await fetchIdMap(
      "drivers",
      "driver_id",
      drivers.map((row) => row.driver_id)
    );
    const constructorIdMap = await fetchIdMap(
      "constructors",
      "constructor_id",
      constructors.map((row) => row.constructor_id)
    );

    const raceKey = `${year}-${round}`;
    const raceUuid = raceIdMap.get(raceKey);
    if (!raceUuid) {
      log(`Race ${raceKey} not found. Skipping results.`);
      continue;
    }

    const { data: existing } = await supabase
      .from("results")
      .select("id")
      .eq("race_id", raceUuid)
      .limit(1);
    if (existing?.length) {
      log(`Race ${raceKey}: results already imported. Skipping.`);
      continue;
    }

    const rawResults = resultRows.map((result) => ({
      race_id: raceUuid,
      driver_id: driverIdMap.get(result.Driver?.driverId) || null,
      constructor_id:
        constructorIdMap.get(result.Constructor?.constructorId) || null,
      grid: toNumber(result.grid),
      position: toNumber(result.position),
      position_text: result.positionText || null,
      status: result.status || null,
      points: toNumber(result.points) || 0,
      laps: toNumber(result.laps) || 0,
      time: result.Time?.time || null,
      fastest_lap_rank: toNumber(result.FastestLap?.rank),
      fastest_lap_time: result.FastestLap?.Time?.time || null,
      fastest_lap_speed: toNumber(result.FastestLap?.AverageSpeed?.speed),
    }));

    const resultMap = new Map();
    rawResults.forEach((row) => {
      const key = `${row.race_id}-${row.driver_id}-${row.constructor_id}`;
      if (!row.driver_id || !row.constructor_id || resultMap.has(key)) return;
      resultMap.set(key, row);
    });
    const results = Array.from(resultMap.values());
    const duplicates = rawResults.length - results.length;
    log(`Season ${year}`);
    log(`Round ${round}`);
    log(`Results fetched: ${rawResults.length}`);
    log(`Unique results: ${results.length}`);
    log(`Duplicates removed: ${duplicates}`);

    const batchSize = 20;
    for (const batch of chunkArray(results, batchSize)) {
      await upsertRows("results", batch, "race_id,driver_id,constructor_id", batchSize);
    }
    log(`Inserted rows: ${results.length}`);

    const assignmentMap = new Map();
    resultRows.forEach((result) => {
      const driver = driverIdMap.get(result.Driver?.driverId) || null;
      const constructor =
        constructorIdMap.get(result.Constructor?.constructorId) || null;
      if (!driver || !constructor) return;
      const key = `${raceUuid}-${driver}-${constructor}`;
      if (assignmentMap.has(key)) return;
      assignmentMap.set(key, {
        driver_id: driver,
        constructor_id: constructor,
        season_year: toNumber(year),
        race_id: raceUuid,
        round: toNumber(round),
        start_round: toNumber(round),
        end_round: toNumber(round),
      });
    });
    const historyRows = Array.from(assignmentMap.values());
    await upsertRows(
      "driver_constructor_history",
      historyRows,
      "race_id,driver_id,constructor_id"
    );

    if (includeQualifying) {
      try {
        const qualifyingData = await fetchAPI(
          `${year}/${round}/qualifying.json?limit=1000`,
          { onRequest: (url) => log(`Endpoint: ${url}`) }
        );
        const qualifyingResults =
          qualifyingData?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || [];
        log(`Qualifying count (round ${round}): ${qualifyingResults.length}`);
        if (qualifyingResults.length) {
          const qualifyingRows = qualifyingResults.map((result) => ({
            race_id: raceUuid,
            driver_id: driverIdMap.get(result.Driver?.driverId) || null,
            constructor_id:
              constructorIdMap.get(result.Constructor?.constructorId) || null,
            q1: result.Q1 || null,
            q2: result.Q2 || null,
            q3: result.Q3 || null,
            position: toNumber(result.position),
          }));
          await upsertRows("qualifying", qualifyingRows, "race_id,driver_id");
        }
      } catch (error) {
        log(`Round ${round}: qualifying fetch failed (${error.message}).`);
      }
    }

    if (includePitStops && Number(year) >= 2012) {
      try {
        const pitStopData = await fetchAPI(
          `${year}/${round}/pitstops.json?limit=1000`,
          { onRequest: (url) => log(`Endpoint: ${url}`) }
        );
        const pitStops =
          pitStopData?.MRData?.RaceTable?.Races?.[0]?.PitStops || [];
        log(`Pit stops count (round ${round}): ${pitStops.length}`);
        if (pitStops.length) {
          const pitRows = pitStops.map((stop) => ({
            race_id: raceUuid,
            driver_id: driverIdMap.get(stop.driverId) || null,
            stop: toNumber(stop.stop),
            lap: toNumber(stop.lap),
            time: stop.time || null,
            duration: stop.duration || null,
          }));
          await upsertRows(
            "pitstops",
            pitRows,
            "race_id,driver_id,lap,stop"
          );
        }
      } catch (error) {
        log(`Round ${round}: pit stops fetch failed (${error.message}).`);
      }
    }
  }

  checkAbort();
  progress("Importing standings", 90);
  try {
    await importStandings(year);
  } catch (error) {
    log(`Standings import failed (${error.message}).`);
  }

  progress("Complete", 100);
}

