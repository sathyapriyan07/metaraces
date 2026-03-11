import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination.jsx";
import { fetchTable, hasSupabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";

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
          <h1 className="font-f1wide text-3xl uppercase tracking-[0.18em]">
            CONSTRUCTORS
          </h1>
          <p className="text-sm text-white/60 font-f1">
            Explore the teams that shaped Formula One history.
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
          className="w-full max-w-xs rounded-full border border-white/10 bg-black/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-f1red/60 focus:outline-none"
        />
      </div>

      <div className="grid gap-4">
        {visible.length ? (
          visible.map((team) => (
            <div
              key={team.constructor_id}
              className="glass-panel flex w-full flex-col gap-4 rounded-[14px] border border-white/10 p-4 transition hover:border-white/20 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white/5">
                  {team.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="h-12 w-12 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-[10px] text-white/40">No logo</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-f1bold text-lg">
                    {team.name}
                  </div>
                  <div className="text-sm text-white/60">
                    {team.nationality || "—"}
                  </div>
                  <div className="text-xs text-white/50">
                    Championships: {team.championships ?? 0}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end">
                <Link
                  to={`/constructors/${team.constructor_id}`}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  View Team
                </Link>
              </div>
            </div>
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

