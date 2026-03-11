import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { searchAll, hasSupabase } from "../services/supabaseClient";

const navLinkBase =
  "text-xs uppercase tracking-[0.18em] whitespace-nowrap transition-colors hover:text-white";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    drivers: [],
    constructors: [],
    circuits: [],
    seasons: [],
  });
  const [open, setOpen] = useState(false);

  const showResults = useMemo(
    () =>
      open &&
      query.length > 2 &&
      (results.drivers.length ||
        results.constructors.length ||
        results.circuits.length ||
        results.seasons.length),
    [open, query.length, results]
  );

  useEffect(() => {
    if (query.length < 3) {
      setResults({
        drivers: [],
        constructors: [],
        circuits: [],
        seasons: [],
      });
      return;
    }
    const handler = setTimeout(async () => {
      const data = await searchAll(query);
      setResults(data);
    }, 350);
    return () => clearTimeout(handler);
  }, [query]);

  return (
    <header className="sticky top-0 z-[100] border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:px-8">
        <div className="flex h-[60px] items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-f1red" />
          </Link>
          <div className="font-f1wide text-lg uppercase tracking-[0.3em] text-white">
            F1 Archive
          </div>
        </div>

        <nav className="scrollbar-hidden flex items-center gap-[18px] overflow-x-auto whitespace-nowrap text-white/70">
          {[
            ["/seasons", "Seasons"],
            ["/drivers", "Drivers"],
            ["/constructors", "Constructors"],
            ["/circuits", "Circuits"],
            ["/races", "Races"],
            ["/admin", "Admin"],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${navLinkBase} ${
                  isActive ? "text-white" : "text-white/60"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search drivers, teams, circuits..."
            className="w-full rounded-[30px] border border-white/10 bg-black/80 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-f1red/60 focus:outline-none"
          />
          {open && query.length > 2 && !hasSupabase() && (
            <div className="absolute mt-2 w-full rounded-2xl border border-white/10 bg-black/90 p-4 text-xs text-white/60">
              Search requires Supabase configuration.
            </div>
          )}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute mt-2 w-full rounded-2xl border border-white/10 bg-black/95 p-4 text-xs text-white/80 shadow-xl"
            >
              <div className="grid gap-3">
                {results.drivers.length > 0 && (
                  <div>
                    <div className="mb-1 text-white/50">Drivers</div>
                    <div className="grid gap-2">
                      {results.drivers.map((driver) => (
                        <Link
                          key={driver.driver_id}
                          to={`/drivers/${driver.driver_id}`}
                          className="rounded-lg bg-white/5 px-3 py-2 transition hover:bg-white/10"
                        >
                          {driver.first_name} {driver.last_name} ·{" "}
                          {driver.nationality}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {results.constructors.length > 0 && (
                  <div>
                    <div className="mb-1 text-white/50">Constructors</div>
                    <div className="grid gap-2">
                      {results.constructors.map((team) => (
                        <Link
                          key={team.constructor_id}
                          to={`/constructors/${team.constructor_id}`}
                          className="rounded-lg bg-white/5 px-3 py-2 transition hover:bg-white/10"
                        >
                          {team.name} · {team.nationality}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {results.circuits.length > 0 && (
                  <div>
                    <div className="mb-1 text-white/50">Circuits</div>
                    <div className="grid gap-2">
                      {results.circuits.map((circuit) => (
                        <Link
                          key={circuit.circuit_id}
                          to={`/circuits/${circuit.circuit_id}`}
                          className="rounded-lg bg-white/5 px-3 py-2 transition hover:bg-white/10"
                        >
                          {circuit.name} · {circuit.country}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {results.seasons.length > 0 && (
                  <div>
                    <div className="mb-1 text-white/50">Seasons</div>
                    <div className="grid gap-2">
                      {results.seasons.map((season) => (
                        <Link
                          key={season.year}
                          to={`/seasons/${season.year}`}
                          className="rounded-lg bg-white/5 px-3 py-2 transition hover:bg-white/10"
                        >
                          {season.year} · {season.total_races} races
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}

