import { supabase } from "./supabaseClient";

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";
const ERGAST_BASE = "https://ergast.com/api/f1";
const DEFAULT_TIMEOUT_MS = 10000;

const normalizeEndpoint = (endpoint) =>
  endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

const buildUrl = (base, endpoint) => `${base}/${normalizeEndpoint(endpoint)}`;

const fetchWithTimeout = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("API timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const ensureSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }
};

export const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const chunkArray = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export const upsertRows = async (table, rows, onConflict, chunkSize = 500) => {
  ensureSupabase();
  if (!rows?.length) return 0;
  let inserted = 0;
  for (const batch of chunkArray(rows, chunkSize)) {
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict });
    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }
    inserted += batch.length;
  }
  return inserted;
};

export const fetchIdMap = async (table, keyColumn, keys, idColumn = "id") => {
  ensureSupabase();
  const map = new Map();
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
  if (!uniqueKeys.length) return map;
  for (const batch of chunkArray(uniqueKeys, 500)) {
    const { data, error } = await supabase
      .from(table)
      .select(`${idColumn}, ${keyColumn}`)
      .in(keyColumn, batch);
    if (error) {
      throw new Error(`Supabase fetch error: ${error.message}`);
    }
    (data || []).forEach((row) => {
      map.set(row[keyColumn], row[idColumn]);
    });
  }
  return map;
};

const fetchJson = async (base, endpoint, options = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, onRequest } = options;
  const url = buildUrl(base, endpoint);
  if (onRequest) onRequest(url);
  const res = await fetchWithTimeout(url, timeoutMs);
  if (!res.ok) {
    throw new Error("API request failed");
  }
  const data = await res.json();
  if (!data?.MRData) {
    throw new Error("Invalid API response");
  }
  return data;
};

export const fetchAPI = async (endpoint, options = {}) => {
  try {
    return await fetchJson(JOLPICA_BASE, endpoint, options);
  } catch (error) {
    try {
      return await fetchJson(ERGAST_BASE, endpoint, options);
    } catch (fallbackError) {
      if (error?.message === "API timeout" || fallbackError?.message === "API timeout") {
        throw new Error("API timeout");
      }
      throw fallbackError;
    }
  }
};

export default fetchAPI;
