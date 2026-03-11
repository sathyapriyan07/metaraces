import { useEffect, useMemo, useState } from "react";
import RaceCard from "../components/RaceCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function Races() {
  const [races, setRaces] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const res = await fetchTable("races", {
        order: { column: "date", ascending: false },
      });
      if (res.data.length) setRaces(res.data);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return races.filter((race) =>
      `${race.race_name} ${race.season_year}`.toLowerCase().includes(term)
    );
  }, [races, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-f1wide text-3xl uppercase tracking-[0.14em]">
            Races
          </h1>
          <p className="text-sm text-white/60 font-f1">
            All Grand Prix events across every season.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search races or seasons..."
          className="w-full max-w-xs rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-f1red/60 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.length ? (
          visible.map((race) => <RaceCard key={race.race_id} race={race} />)
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-white/60">
            No races imported yet.
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

