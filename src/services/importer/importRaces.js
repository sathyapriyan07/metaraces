import { fetchAPI, fetchIdMap, toNumber, upsertRows } from "../f1ApiClient";

export async function importRaces(year) {
  const data = await fetchAPI(`${year}.json?limit=1000`);
  const races = data?.MRData?.RaceTable?.Races || [];
  if (!races.length) {
    throw new Error("No data returned");
  }

  await upsertRows("seasons", [{ year: toNumber(year), url: null }], "year");

  const circuitMap = new Map();
  races.forEach((race) => {
    const circuit = race.Circuit;
    if (!circuit?.circuitId || circuitMap.has(circuit.circuitId)) return;
    circuitMap.set(circuit.circuitId, {
      circuit_id: circuit.circuitId,
      name: circuit.circuitName,
      locality: circuit.Location?.locality || null,
      country: circuit.Location?.country || null,
      lat: toNumber(circuit.Location?.lat),
      lng: toNumber(circuit.Location?.long),
      url: circuit.url || null,
      map_url: null,
      image_url: null,
    });
  });
  const circuits = Array.from(circuitMap.values());
  await upsertRows("circuits", circuits, "circuit_id");
  const circuitIdMap = await fetchIdMap(
    "circuits",
    "circuit_id",
    circuits.map((circuit) => circuit.circuit_id)
  );

  const raceRows = races.map((race) => ({
    race_id: `${race.season}-${race.round}`,
    season_year: toNumber(race.season),
    round: toNumber(race.round),
    circuit_id: circuitIdMap.get(race.Circuit?.circuitId) || null,
    name: race.raceName,
    date: race.date || null,
    time: race.time || null,
    url: race.url || null,
  }));

  const inserted = await upsertRows("races", raceRows, "race_id");
  return { fetched: races.length, inserted };
}

