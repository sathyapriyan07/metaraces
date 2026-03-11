import { supabase, hasSupabase } from "../supabaseClient";

const ERGAST_BASE = "https://api.jolpi.ca/ergast/f1";

export function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function fetchJson(url, timeoutMs = 10000) {
  if (!url) throw new Error("API request failed");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error("API request failed");
    }
    return await res.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("API unreachable");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function ergastUrl(path, params = {}) {
  const url = new URL(`${ERGAST_BASE}${path}.json`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export async function upsertRows(table, rows, onConflict) {
  if (!hasSupabase()) throw new Error("Supabase not configured");
  if (!rows.length) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict });
  if (error) {
    throw new Error(`Supabase insert error: ${error.message}`);
  }
}

export async function fetchIdMap(table, uniqueKey, values) {
  if (!hasSupabase()) throw new Error("Supabase not configured");
  const map = new Map();
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));
  const chunks = chunkArray(uniqueValues, 200);
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${uniqueKey}`)
      .in(uniqueKey, chunk);
    if (error) {
      throw new Error(`Supabase fetch error: ${error.message}`);
    }
    (data || []).forEach((row) => map.set(row[uniqueKey], row.id));
  }
  return map;
}
