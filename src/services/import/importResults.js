import {
  ergastUrl,
  fetchJson,
  fetchIdMap,
  upsertRows,
} from "./importUtils";

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

  const rows = results.map((result) => ({
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
  await upsertRows("results", rows, "race_id,driver_id");
  return rows.length;
}
