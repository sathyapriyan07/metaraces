import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination.jsx";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function Seasons() {
  const currentYear = new Date().getFullYear();
  const [seasons, setSeasons] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const res = await fetchTable("seasons", {
        order: { column: "year", ascending: false },
      });
      setSeasons(res.data);
    };
    load();
  }, []);

  const totalPages = Math.ceil(seasons.length / perPage) || 1;
  const visible = useMemo(
    () => seasons.slice((page - 1) * perPage, page * perPage),
    [page, seasons]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-f1wide text-3xl uppercase tracking-[0.14em]">
            Seasons Archive
          </h1>
          <p className="text-sm text-white/60 font-f1">
            Complete list of every FIA Formula One World Championship season.
          </p>
        </div>
      <span className="text-xs uppercase tracking-[0.3em] text-white/40">
          1950 - {currentYear}
      </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.length ? (
          visible.map((season) => (
            <Link
              key={season.year}
              to={`/seasons/${season.year}`}
              className="glass-panel rounded-2xl p-5 transition hover:-translate-y-1"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                Season
              </div>
            <div className="mt-3 font-f1bold text-2xl">{season.year}</div>
              <div className="mt-2 text-xs text-white/60">
                Full calendar
              </div>
            </Link>
          ))
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-white/60">
            No seasons available.
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
