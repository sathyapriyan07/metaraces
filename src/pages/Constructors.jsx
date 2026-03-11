import { useEffect, useMemo, useState } from "react";
import TeamCard from "../components/TeamCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function Constructors() {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const res = await fetchTable("constructors", {
        order: { column: "name", ascending: true },
      });
      if (res.data.length) setTeams(res.data);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return teams.filter((team) => team.name.toLowerCase().includes(term));
  }, [teams, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-f1wide text-3xl uppercase tracking-[0.14em]">
            Constructors
          </h1>
          <p className="text-sm text-white/60 font-f1">
            Every team to compete in the Formula One World Championship.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search teams..."
          className="w-full max-w-xs rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-f1red/60 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.length ? (
          visible.map((team) => (
            <TeamCard key={team.constructor_id} team={team} />
          ))
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-white/60">
            No constructors imported yet.
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

