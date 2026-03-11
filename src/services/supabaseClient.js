import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function hasSupabase() {
  return Boolean(supabase);
}

export async function fetchTable(table, options = {}) {
  if (!supabase) {
    return { data: [], error: "Supabase is not configured." };
  }
  const { select = "*", filters = {}, order, limit } = options;
  let query = supabase.from(table).select(select);
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    query = query.eq(key, value);
  });
  if (order) {
    query = query.order(order.column, { ascending: order.ascending ?? true });
  }
  if (limit) {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  return { data: data || [], error: error?.message || null };
}

export async function searchAll(query) {
  if (!supabase || !query) {
    return { drivers: [], constructors: [], circuits: [], seasons: [] };
  }

  const [drivers, constructors, circuits, seasons] = await Promise.all([
    supabase
      .from("drivers")
      .select("driver_id, first_name, last_name, nationality")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(6),
    supabase
      .from("constructors")
      .select("constructor_id, name, nationality")
      .ilike("name", `%${query}%`)
      .limit(6),
    supabase
      .from("circuits")
      .select("circuit_id, name, country")
      .ilike("name", `%${query}%`)
      .limit(6),
    supabase
      .from("seasons")
      .select("year, total_races")
      .or(`year.eq.${Number(query) || 0}`)
      .limit(6),
  ]);

  return {
    drivers: drivers.data || [],
    constructors: constructors.data || [],
    circuits: circuits.data || [],
    seasons: seasons.data || [],
  };
}
