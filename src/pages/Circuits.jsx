import { useEffect, useMemo, useState } from "react";
import CircuitCard from "../components/CircuitCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { fetchTable, hasSupabase, supabase } from "../services/supabaseClient";
import { getCircuits } from "../services/ergastService";
import { mapErgastCircuits } from "../services/ergastMapper";

export default function Circuits() {
  const [circuits, setCircuits] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const perPage = 12;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let dbCircuits = [];
      if (hasSupabase()) {
        const res = await fetchTable("circuits", {
          order: { column: "name", ascending: true },
        });
        dbCircuits = res.data;
      }
      if (dbCircuits.length) {
        if (!cancelled) {
          setCircuits(dbCircuits);
          setLoading(false);
        }
        return;
      }
      try {
        const ergastCircuits = await getCircuits();
        const mapped = mapErgastCircuits(ergastCircuits);
        if (!cancelled) setCircuits(mapped);
        if (hasSupabase() && mapped.length) {
          await supabase.from("circuits").upsert(mapped, {
            onConflict: "circuit_id",
          });
        }
      } catch {
        if (!cancelled) setCircuits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return circuits.filter((circuit) =>
      circuit.name.toLowerCase().includes(term)
    );
  }, [circuits, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-f1wide text-3xl uppercase tracking-[0.14em]">
            Circuits
          </h1>
          <p className="text-sm text-white/60 font-f1">
            Global circuits that shaped Formula One history.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search circuits..."
          className="w-full max-w-xs rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-f1red/60 focus:outline-none"
        />
      </div>

      {!visible.length && (
        <div className="glass-panel rounded-2xl p-6 text-white/60">
          {loading ? "Loading circuits..." : "No data available."}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((circuit) => (
          <CircuitCard key={circuit.circuit_id} circuit={circuit} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

