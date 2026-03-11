import { useEffect, useMemo, useState } from "react";
import CircuitCard from "../components/CircuitCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function Circuits() {
  const [circuits, setCircuits] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const res = await fetchTable("circuits", {
        order: { column: "name", ascending: true },
      });
      setCircuits(res.data);
    };
    load();
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
          No circuit data yet. Import Excel data to populate this page.
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

