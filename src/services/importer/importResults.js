import { supabase } from "../supabaseClient";
import {
  fetchAPI,
  fetchIdMap,
  toNumber,
  upsertRows,
  chunkArray,
} from "../f1ApiClient";
import { importRaces } from "./importRaces";
import { buildDriverRows } from "./importDrivers";
import { buildConstructorRows } from "./importConstructors";

const buildResultRows = (raceUuid, driverIdMap, constructorIdMap, results) =>
  results.map((result) => ({
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

export async function importResults(year, round) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }
  if (!year || !round) {
    throw new Error("Season and round required");
  }

  const data = await fetchAPI(`${year}/${round}/results.json?limit=1000`);
  const rawResults = data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
  if (!rawResults.length) {
    throw new Error("No data returned");
  }

  console.log(`Season ${year}`);
  console.log(`Round ${round}`);
  console.log(`Results fetched: ${rawResults.length}`);

  const raceKey = `${year}-${round}`;
  let raceIdMap = await fetchIdMap("races", "race_id", [raceKey]);
  if (!raceIdMap.get(raceKey)) {
    await importRaces(year);
    raceIdMap = await fetchIdMap("races", "race_id", [raceKey]);
  }
  const raceUuid = raceIdMap.get(raceKey);
  if (!raceUuid) {
    throw new Error("Race not found");
  }

  const { data: existing } = await supabase
    .from("results")
    .select("id")
    .eq("race_id", raceUuid)
    .limit(1);
  if (existing?.length) {
    console.log("Results already exist for this race. Skipping.");
    return {
      fetched: rawResults.length,
      unique: 0,
      duplicates: rawResults.length,
      inserted: 0,
      skipped: true,
    };
  }

  const driverRows = buildDriverRows(rawResults);
  const constructorRows = buildConstructorRows(rawResults);
  await upsertRows("drivers", driverRows, "driver_id");
  await upsertRows("constructors", constructorRows, "constructor_id");

  const driverIdMap = await fetchIdMap(
    "drivers",
    "driver_id",
    driverRows.map((row) => row.driver_id)
  );
  const constructorIdMap = await fetchIdMap(
    "constructors",
    "constructor_id",
    constructorRows.map((row) => row.constructor_id)
  );

  const rawRows = buildResultRows(
    raceUuid,
    driverIdMap,
    constructorIdMap,
    rawResults
  );
  const resultMap = new Map();
  rawRows.forEach((row) => {
    const key = `${row.race_id}-${row.driver_id}-${row.constructor_id}`;
    if (!row.driver_id || !row.constructor_id || resultMap.has(key)) return;
    resultMap.set(key, row);
  });
  const uniqueResults = Array.from(resultMap.values());
  const duplicates = rawRows.length - uniqueResults.length;
  console.log(`Unique results: ${uniqueResults.length}`);
  console.log(`Duplicates removed: ${duplicates}`);

  const BATCH_SIZE = 20;
  for (const batch of chunkArray(uniqueResults, BATCH_SIZE)) {
    await upsertRows(
      "results",
      batch,
      "race_id,driver_id,constructor_id",
      BATCH_SIZE
    );
  }
  console.log(`Inserted rows: ${uniqueResults.length}`);

  return {
    fetched: rawResults.length,
    unique: uniqueResults.length,
    duplicates,
    inserted: uniqueResults.length,
  };
}

