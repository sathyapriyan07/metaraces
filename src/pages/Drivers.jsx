import { useEffect, useMemo, useState } from "react";
import DriverCard from "../components/DriverCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const res = await fetchTable("drivers", {
        order: { column: "family_name", ascending: true },
      });
      setDrivers(res.data);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return drivers.filter((driver) =>
      `${driver.given_name} ${driver.family_name}`.toLowerCase().includes(term)
    );
  }, [drivers, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-f1wide text-3xl uppercase tracking-[0.14em]">
            Drivers
          </h1>
          <p className="text-sm text-white/60 font-f1">
            Every driver to start a Formula One Grand Prix.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search drivers..."
          className="w-full max-w-xs rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-f1red/60 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.length ? (
          visible.map((driver) => (
            <DriverCard key={driver.driver_id} driver={driver} />
          ))
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-white/60">
            No drivers available.
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

