import { fetchAPI, upsertRows } from "../f1ApiClient";

const mapConstructorRows = (results) => {
  const constructorMap = new Map();
  results.forEach((result) => {
    const constructor = result.Constructor;
    if (!constructor?.constructorId || constructorMap.has(constructor.constructorId)) {
      return;
    }
    constructorMap.set(constructor.constructorId, {
      constructor_id: constructor.constructorId,
      name: constructor.name || null,
      nationality: constructor.nationality || null,
      logo_url: null,
      url: constructor.url || null,
    });
  });
  return Array.from(constructorMap.values());
};

export async function importConstructors(year, round) {
  if (!year || !round) {
    throw new Error("Season and round required");
  }
  const data = await fetchAPI(`${year}/${round}/results.json?limit=1000`);
  const results = data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
  if (!results.length) {
    throw new Error("No data returned");
  }
  const rows = mapConstructorRows(results);
  const inserted = await upsertRows("constructors", rows, "constructor_id");
  return { fetched: results.length, inserted };
}

export const buildConstructorRows = mapConstructorRows;

