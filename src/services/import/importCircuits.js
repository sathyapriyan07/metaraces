import { ergastUrl, fetchJson, upsertRows } from "./importUtils";

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function importCircuits() {
  const url = ergastUrl("/circuits", { limit: 1000 });
  const data = await fetchJson(url);
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
  await upsertRows("circuits", rows, "circuit_id");
  return rows.length;
}
