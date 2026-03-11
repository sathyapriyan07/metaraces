import { ergastUrl, fetchJson, upsertRows } from "./importUtils";

export async function importSeasons() {
  const url = ergastUrl("/seasons", { limit: 1000 });
  const data = await fetchJson(url);
  const seasons = data?.MRData?.SeasonTable?.Seasons || [];
  if (!seasons.length) {
    throw new Error("No data returned");
  }
  const rows = seasons.map((season) => ({
    year: Number(season.season),
    url: season.url || null,
  }));
  await upsertRows("seasons", rows, "year");
  return rows.length;
}
