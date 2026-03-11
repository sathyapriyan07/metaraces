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

export async function importResults(year, round) {
  const url = ergastUrl(`/${year}/${round}/results`, { limit: 1000 });
  const data = await fetchJson(url);
  const results = data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
  if (!results.length) {
    throw new Error("No data returned");
  }

  const drivers = results.map((result) => ({
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
  const constructors = results.map((result) => ({
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
  const raceIdMap = await fetchIdMap("races", "race_id", [`${year}-${round}`]);
  const raceUuid = raceIdMap.get(`${year}-${round}`);
  if (!raceUuid) {
    throw new Error("Race not found");
  }

  const { data: existingResult } = await supabase
    .from("results")
    .select("id")
    .eq("race_id", raceUuid)
    .limit(1);
  if (existingResult?.length) {
    console.log(`Race ${year}-${round}: results already imported. Skipping.`);
    return 0;
  }

  const rawRows = results.map((result) => ({
    race_id: raceUuid,
    driver_id: driverIdMap.get(result.Driver?.driverId) || null,
    constructor_id: constructorIdMap.get(result.Constructor?.constructorId) || null,
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
  rawRows.forEach((row) => {
    const key = `${row.race_id}-${row.driver_id}-${row.constructor_id}`;
    if (!row.driver_id || !row.constructor_id || resultMap.has(key)) return;
    resultMap.set(key, row);
  });
  const rows = Array.from(resultMap.values());
  const skipped = rawRows.length - rows.length;
  console.log(`Season ${year}`);
  console.log(`Round ${round}`);
  console.log(`Results fetched: ${rawRows.length}`);
  console.log(`Unique results: ${rows.length}`);
  console.log(`Duplicates removed: ${skipped}`);

  const batchSize = 20;
  for (let idx = 0; idx < rows.length; idx += batchSize) {
    const batch = rows.slice(idx, idx + batchSize);
    await upsertRows("results", batch, "race_id,driver_id,constructor_id");
  }
  console.log(`Inserted rows: ${rows.length}`);
  return rows.length;
}
