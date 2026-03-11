import { fetchAPI, toNumber, upsertRows } from "../f1ApiClient";

export async function importCircuits() {
  const data = await fetchAPI("circuits.json?limit=1000");
  const circuits = data?.MRData?.CircuitTable?.Circuits || [];
  if (!circuits.length) {
    throw new Error("No data returned");
  }

  const rows = circuits.map((circuit) => ({
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

  const inserted = await upsertRows("circuits", rows, "circuit_id");
  return { fetched: circuits.length, inserted };
}

