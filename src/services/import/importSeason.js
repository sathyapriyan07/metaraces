import {
  ergastUrl,
  fetchJson,
  fetchIdMap,
  upsertRows,
} from "./importUtils";
import { supabase } from "../supabaseClient";

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function importSeason(year, options = {}) {
  const {
    includeQualifying = true,
    includePitStops = true,
    onProgress,
    onLog,
  } = options;

  const log = (message) => {
    if (onLog) onLog(message);
    console.log(message);
  };
  const progress = (stage, percent) => {
    if (onProgress) onProgress(stage, percent);
  };

  progress("Fetching schedule", 5);
  const scheduleUrl = ergastUrl(`/${year}`, { limit: 1000 });
  log(`Endpoint: ${scheduleUrl}`);
  const scheduleData = await fetchJson(scheduleUrl);
  const races = scheduleData?.MRData?.RaceTable?.Races || [];
  log(`Race count: ${races.length}`);
  if (!races.length) {
    throw new Error("No race data returned");
  }

  await upsertRows("seasons", [{ year, url: null }], "year");

  progress("Importing circuits", 15);
  const circuits = races
    .map((race) => race.Circuit)
    .filter(Boolean)
    .map((circuit) => ({
      circuit_id: circuit.circuitId,
      name: circuit.circuitName,
      locality: circuit.Location?.locality || null,
      country: circuit.Location?.country || null,
      lat: toNumber(circuit.Location?.lat),
      lng: toNumber(circuit.Location?.long),
      url: circuit.url || null,
      map_url: null,
      image_url: null,
    }));
  await upsertRows("circuits", circuits, "circuit_id");
  const circuitIdMap = await fetchIdMap(
    "circuits",
    "circuit_id",
    circuits.map((circuit) => circuit.circuit_id)
  );

  progress("Importing races", 25);
  const raceRows = races.map((race) => ({
    race_id: `${race.season}-${race.round}`,
    season_year: Number(race.season),
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
    raceRows.map((race) => race.race_id)
  );

  const rounds = raceRows.map((race) => race.round).filter(Boolean);
  for (let i = 0; i < rounds.length; i += 1) {
    const round = rounds[i];
    const percent = 25 + Math.round(((i + 1) / rounds.length) * 50);
    progress(`Importing results (Round ${round})`, percent);
    const resultsUrl = ergastUrl(`/${year}/${round}/results`, { limit: 1000 });
    log(`Endpoint: ${resultsUrl}`);
    const resultsData = await fetchJson(resultsUrl);
    const resultRows =
      resultsData?.MRData?.RaceTable?.Races?.[0]?.Results || [];
    log(`Results count (round ${round}): ${resultRows.length}`);
    if (!resultRows.length) {
      throw new Error("No race data returned");
    }

    const drivers = resultRows.map((result) => ({
      driver_id: result.Driver?.driverId,
      code: result.Driver?.code || null,
      given_name: result.Driver?.givenName || null,
      family_name: result.Driver?.familyName || null,
      date_of_birth: result.Driver?.dateOfBirth || null,
      nationality: result.Driver?.nationality || null,
      permanent_number: toNumber(result.Driver?.permanentNumber),
      photo_url: null,
      url: result.Driver?.url || null,
    }));
    const constructors = resultRows.map((result) => ({
      constructor_id: result.Constructor?.constructorId,
      name: result.Constructor?.name,
      nationality: result.Constructor?.nationality || null,
      logo_url: null,
      url: result.Constructor?.url || null,
    }));
    await upsertRows("drivers", drivers, "driver_id");
    await upsertRows("constructors", constructors, "constructor_id");

    const driverIdMap = await fetchIdMap(
      "drivers",
      "driver_id",
      drivers.map((driver) => driver.driver_id)
    );
    const constructorIdMap = await fetchIdMap(
      "constructors",
      "constructor_id",
      constructors.map((constructor) => constructor.constructor_id)
    );

    const raceKey = `${year}-${round}`;
    const raceUuid = raceIdMap.get(raceKey);
    if (!raceUuid) {
      throw new Error("Race not found");
    }

    const { data: existingResult } = await supabase
      .from("results")
      .select("id")
      .eq("race_id", raceUuid)
      .limit(1);
    if (existingResult?.length) {
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
      points: toNumber(result.points),
      laps: toNumber(result.laps),
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
    const skipped = rawResults.length - results.length;
    log(`Season ${year}`);
    log(`Round ${round}`);
    log(`Results fetched: ${rawResults.length}`);
    log(`Unique results: ${results.length}`);
    log(`Duplicates removed: ${skipped}`);

    const batchSize = 20;
    for (let idx = 0; idx < results.length; idx += batchSize) {
      const batch = results.slice(idx, idx + batchSize);
      await upsertRows("results", batch, "race_id,driver_id,constructor_id");
    }
    log(`Inserted rows: ${results.length}`);

    const historyRows = resultRows.map((result) => ({
      driver_id: driverIdMap.get(result.Driver?.driverId) || null,
      constructor_id:
        constructorIdMap.get(result.Constructor?.constructorId) || null,
      season_year: Number(year),
      race_id: raceUuid,
      round: toNumber(round),
      start_round: toNumber(round),
      end_round: toNumber(round),
    }));
    await upsertRows(
      "driver_constructor_history",
      historyRows,
      "driver_id,constructor_id,season_year,race_id"
    );

    if (includeQualifying) {
      const qualifyingUrl = ergastUrl(`/${year}/${round}/qualifying`, {
        limit: 1000,
      });
      log(`Endpoint: ${qualifyingUrl}`);
      const qualifyingData = await fetchJson(qualifyingUrl);
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
    }

    if (includePitStops && Number(year) >= 2012) {
      const pitStopsUrl = ergastUrl(`/${year}/${round}/pitstops`, {
        limit: 1000,
      });
      log(`Endpoint: ${pitStopsUrl}`);
      const pitStopData = await fetchJson(pitStopsUrl);
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
        await upsertRows("pitstops", pitRows, "race_id,driver_id,stop");
      }
    }
  }

  progress("Importing standings", 90);
  const driverStandingsUrl = ergastUrl(`/${year}/driverStandings`, {
    limit: 1000,
  });
  log(`Endpoint: ${driverStandingsUrl}`);
  const driverStandingsData = await fetchJson(driverStandingsUrl);
  const driverStandings =
    driverStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]
      ?.DriverStandings || [];
  if (!driverStandings.length) {
    throw new Error("No race data returned");
  }
  const driverIdMap = await fetchIdMap(
    "drivers",
    "driver_id",
    driverStandings.map((row) => row.Driver?.driverId)
  );
  const driverStandingsRows = driverStandings.map((row) => ({
    season_year: Number(year),
    driver_id: driverIdMap.get(row.Driver?.driverId) || null,
    points: toNumber(row.points),
    wins: toNumber(row.wins),
    position: toNumber(row.position),
  }));
  await upsertRows("driver_standings", driverStandingsRows, "season_year,driver_id");

  const constructorStandingsUrl = ergastUrl(`/${year}/constructorStandings`, {
    limit: 1000,
  });
  log(`Endpoint: ${constructorStandingsUrl}`);
  const constructorStandingsData = await fetchJson(constructorStandingsUrl);
  const constructorStandings =
    constructorStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]
      ?.ConstructorStandings || [];
  if (!constructorStandings.length) {
    throw new Error("No race data returned");
  }
  const constructorIdMap = await fetchIdMap(
    "constructors",
    "constructor_id",
    constructorStandings.map((row) => row.Constructor?.constructorId)
  );
  const constructorStandingsRows = constructorStandings.map((row) => ({
    season_year: Number(year),
    constructor_id: constructorIdMap.get(row.Constructor?.constructorId) || null,
    points: toNumber(row.points),
    wins: toNumber(row.wins),
    position: toNumber(row.position),
  }));
  await upsertRows(
    "constructor_standings",
    constructorStandingsRows,
    "season_year,constructor_id"
  );

  progress("Complete", 100);
}
