import { ergastUrl, fetchJson, fetchIdMap, upsertRows } from "./importUtils";

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function importRaces(year) {
  const url = ergastUrl(`/${year}`, { limit: 1000 });
  const data = await fetchJson(url);
  const races = data?.MRData?.RaceTable?.Races || [];
  if (!races.length) {
    throw new Error("No data returned");
  }
  await upsertRows("seasons", [{ year: Number(year), url: null }], "year");

  const circuitRows = races
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
  await upsertRows("circuits", circuitRows, "circuit_id");
  const circuitIdMap = await fetchIdMap(
    "circuits",
    "circuit_id",
    circuitRows.map((row) => row.circuit_id)
  );

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
  return raceRows.length;
}
