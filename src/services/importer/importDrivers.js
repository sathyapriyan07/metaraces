import { fetchAPI, toNumber, upsertRows } from "../f1ApiClient";

const mapDriverRows = (results) => {
  const driverMap = new Map();
  results.forEach((result) => {
    const driver = result.Driver;
    if (!driver?.driverId || driverMap.has(driver.driverId)) return;
    driverMap.set(driver.driverId, {
      driver_id: driver.driverId,
      code: driver.code || null,
      given_name: driver.givenName || null,
      family_name: driver.familyName || null,
      date_of_birth: driver.dateOfBirth || null,
      nationality: driver.nationality || null,
      permanent_number: toNumber(driver.permanentNumber),
      photo_url: null,
      url: driver.url || null,
    });
  });
  return Array.from(driverMap.values());
};

export async function importDrivers(year, round) {
  if (!year || !round) {
    throw new Error("Season and round required");
  }
  const data = await fetchAPI(`${year}/${round}/results.json?limit=1000`);
  const results = data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
  if (!results.length) {
    throw new Error("No data returned");
  }
  const rows = mapDriverRows(results);
  const inserted = await upsertRows("drivers", rows, "driver_id");
  return { fetched: results.length, inserted };
}

export const buildDriverRows = mapDriverRows;

