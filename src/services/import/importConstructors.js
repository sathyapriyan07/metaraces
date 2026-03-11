import { ergastUrl, fetchJson, upsertRows } from "./importUtils";

export async function importConstructors() {
  const url = ergastUrl("/constructors", { limit: 1000 });
  const data = await fetchJson(url);
  const constructors = data?.MRData?.ConstructorTable?.Constructors || [];
  if (!constructors.length) {
    throw new Error("No data returned");
  }
  const rows = constructors.map((team) => ({
    constructor_id: team.constructorId,
    name: team.name,
    nationality: team.nationality || null,
    logo_url: null,
    url: team.url || null,
  }));
  await upsertRows("constructors", rows, "constructor_id");
  return rows.length;
}
