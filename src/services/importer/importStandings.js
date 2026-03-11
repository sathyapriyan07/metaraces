import { fetchAPI, fetchIdMap, toNumber, upsertRows } from "../f1ApiClient";

export async function importDriverStandings(year) {
  const data = await fetchAPI(`${year}/driverStandings.json?limit=1000`);
  const standings =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
  if (!standings.length) {
    throw new Error("No data returned");
  }
  const driverIdMap = await fetchIdMap(
    "drivers",
    "driver_id",
    standings.map((row) => row.Driver?.driverId)
  );
  const rows = standings.map((row) => ({
    season_year: toNumber(year),
    driver_id: driverIdMap.get(row.Driver?.driverId) || null,
    points: toNumber(row.points) || 0,
    wins: toNumber(row.wins) || 0,
    position: toNumber(row.position),
  }));
  const filtered = rows.filter((row) => row.driver_id);
  const inserted = await upsertRows(
    "driver_standings",
    filtered,
    "season_year,driver_id"
  );
  return { fetched: standings.length, inserted };
}

export async function importConstructorStandings(year) {
  const data = await fetchAPI(`${year}/constructorStandings.json?limit=1000`);
  const standings =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
  if (!standings.length) {
    throw new Error("No data returned");
  }
  const constructorIdMap = await fetchIdMap(
    "constructors",
    "constructor_id",
    standings.map((row) => row.Constructor?.constructorId)
  );
  const rows = standings.map((row) => ({
    season_year: toNumber(year),
    constructor_id: constructorIdMap.get(row.Constructor?.constructorId) || null,
    points: toNumber(row.points) || 0,
    wins: toNumber(row.wins) || 0,
    position: toNumber(row.position),
  }));
  const filtered = rows.filter((row) => row.constructor_id);
  const inserted = await upsertRows(
    "constructor_standings",
    filtered,
    "season_year,constructor_id"
  );
  return { fetched: standings.length, inserted };
}

export async function importStandings(year) {
  const driver = await importDriverStandings(year);
  const constructor = await importConstructorStandings(year);
  return { driver, constructor };
}

