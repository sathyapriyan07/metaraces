import { ergastUrl, fetchJson, fetchIdMap, upsertRows } from "./importUtils";

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function importDriverStandings(year) {
  const driverUrl = ergastUrl(`/${year}/driverStandings`, { limit: 1000 });
  const driverData = await fetchJson(driverUrl);
  const driverStandings =
    driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ||
    [];
  if (!driverStandings.length) {
    throw new Error("No data returned");
  }
  const driverIdMap = await fetchIdMap(
    "drivers",
    "driver_id",
    driverStandings.map((row) => row.Driver?.driverId)
  );
  const driverRows = driverStandings.map((row) => ({
    season_year: Number(year),
    driver_id: driverIdMap.get(row.Driver?.driverId) || null,
    points: toNumber(row.points),
    wins: toNumber(row.wins),
    position: toNumber(row.position),
  }));
  await upsertRows("driver_standings", driverRows, "season_year,driver_id");
  return driverRows.length;
}

export async function importConstructorStandings(year) {
  const constructorUrl = ergastUrl(`/${year}/constructorStandings`, {
    limit: 1000,
  });
  const constructorData = await fetchJson(constructorUrl);
  const constructorStandings =
    constructorData?.MRData?.StandingsTable?.StandingsLists?.[0]
      ?.ConstructorStandings || [];
  if (!constructorStandings.length) {
    throw new Error("No data returned");
  }
  const constructorIdMap = await fetchIdMap(
    "constructors",
    "constructor_id",
    constructorStandings.map((row) => row.Constructor?.constructorId)
  );
  const constructorRows = constructorStandings.map((row) => ({
    season_year: Number(year),
    constructor_id: constructorIdMap.get(row.Constructor?.constructorId) || null,
    points: toNumber(row.points),
    wins: toNumber(row.wins),
    position: toNumber(row.position),
  }));
  await upsertRows(
    "constructor_standings",
    constructorRows,
    "season_year,constructor_id"
  );
  return constructorRows.length;
}

export async function importStandings(year) {
  const [driverCount, constructorCount] = await Promise.all([
    importDriverStandings(year),
    importConstructorStandings(year),
  ]);
  return { driverCount, constructorCount };
}
