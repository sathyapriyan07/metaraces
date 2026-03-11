import { fetchAPI, toNumber, upsertRows } from "../f1ApiClient";

export async function importSeasons() {
  const data = await fetchAPI("seasons.json?limit=1000");
  const seasons = data?.MRData?.SeasonTable?.Seasons || [];
  if (!seasons.length) {
    throw new Error("No data returned");
  }
  const rows = seasons.map((season) => ({
    year: toNumber(season.season),
    url: season.url || null,
  }));
  const inserted = await upsertRows("seasons", rows, "year");
  return { fetched: seasons.length, inserted };
}

