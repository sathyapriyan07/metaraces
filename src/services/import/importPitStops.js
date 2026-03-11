import { ergastUrl, fetchJson, fetchIdMap, upsertRows } from "./importUtils";

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function importPitStops(year, round) {
  const url = ergastUrl(`/${year}/${round}/pitstops`, { limit: 1000 });
  const data = await fetchJson(url);
  const stops = data?.MRData?.RaceTable?.Races?.[0]?.PitStops || [];
  if (!stops.length) {
    throw new Error("No data returned");
  }
  const raceIdMap = await fetchIdMap("races", "race_id", [`${year}-${round}`]);
  const raceUuid = raceIdMap.get(`${year}-${round}`);
  if (!raceUuid) throw new Error("Race not found");
  const driverIdMap = await fetchIdMap(
    "drivers",
    "driver_id",
    stops.map((stop) => stop.driverId)
  );

  const rows = stops.map((stop) => ({
    race_id: raceUuid,
    driver_id: driverIdMap.get(stop.driverId) || null,
    stop: toNumber(stop.stop),
    lap: toNumber(stop.lap),
    time: stop.time || null,
    duration: stop.duration || null,
  }));
  await upsertRows("pitstops", rows, "race_id,driver_id,stop");
  return rows.length;
}
