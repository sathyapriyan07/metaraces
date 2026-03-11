import { ergastUrl, fetchJson, upsertRows } from "./importUtils";

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function importDrivers() {
  const url = ergastUrl("/drivers", { limit: 1000 });
  const data = await fetchJson(url);
  const drivers = data?.MRData?.DriverTable?.Drivers || [];
  if (!drivers.length) {
    throw new Error("No data returned");
  }
  const rows = drivers.map((driver) => ({
    driver_id: driver.driverId,
    code: driver.code || null,
    given_name: driver.givenName || null,
    family_name: driver.familyName || null,
    date_of_birth: driver.dateOfBirth || null,
    nationality: driver.nationality || null,
    permanent_number: toNumber(driver.permanentNumber),
    photo_url: null,
    url: driver.url || null,
  }));
  await upsertRows("drivers", rows, "driver_id");
  return rows.length;
}
