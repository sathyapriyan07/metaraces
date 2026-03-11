import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { hasSupabase, supabase } from "../services/supabaseClient";

export default function ConstructorDetails() {
  const { constructorId } = useParams();
  const [team, setTeam] = useState(null);
  const [results, setResults] = useState([]);
  const [driversBySeason, setDriversBySeason] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const { data: teamRow } = await supabase
        .from("constructors")
        .select("*")
        .eq("constructor_id", constructorId)
        .limit(1)
        .maybeSingle();
      setTeam(teamRow || null);
      if (!teamRow) {
        setResults([]);
        setDriversBySeason([]);
        return;
      }

      const { data: resultsRows } = await supabase
        .from("results")
        .select(
          "position, points, driver:drivers(given_name,family_name,driver_id), race:races(name,season_year)"
        )
        .eq("constructor_id", teamRow.id)
        .order("race_id", { ascending: false })
        .limit(20);
      setResults(resultsRows || []);

      const { data: driverRows } = await supabase
        .from("driver_constructor_history")
        .select("season_year, driver:drivers(given_name,family_name,driver_id)")
        .eq("constructor_id", teamRow.id)
        .order("season_year", { ascending: false });
      const grouped = new Map();
      (driverRows || []).forEach((row) => {
        const year = row.season_year;
        if (!grouped.has(year)) grouped.set(year, []);
        grouped.get(year).push(row.driver);
      });
      const timeline = Array.from(grouped.entries()).map(([year, drivers]) => ({
        year,
        drivers: drivers.filter(Boolean),
      }));
      setDriversBySeason(timeline);
    };
    load();
  }, [constructorId]);

  if (!team) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-white/70">
        Constructor profile not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-2xl bg-white/5 p-4">
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={team.name}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                No logo available
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Constructor
            </p>
            <h1 className="mt-3 font-f1bold text-3xl">{team.name}</h1>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <div>Nationality: {team.nationality}</div>
              <div>ID: {team.constructor_id}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Driver History</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {driversBySeason.length ? (
            driversBySeason.map((entry) => (
              <div
                key={entry.year}
                className="rounded-2xl border border-white/10 bg-black/80 p-4"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                  {entry.year}
                </div>
                <div className="mt-2 grid gap-1 text-sm text-white/80">
                  {entry.drivers.map((driver, index) => (
                    <div key={`${driver.driver_id}-${index}`}>
                      {driver.given_name} {driver.family_name}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/80 p-4 text-sm text-white/60">
              No drivers linked to this constructor yet.
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Recent Results</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Race</th>
                <th className="py-2 pr-3">Driver</th>
                <th className="py-2 pr-3">Finish</th>
                <th className="py-2 pr-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={`${result.race?.name}-${index}`} className="border-t border-white/5">
                  <td className="py-2 pr-3">
                    {result.race
                      ? `${result.race.season_year} ${result.race.name}`
                      : "--"}
                  </td>
                  <td className="py-2 pr-3">
                    {result.driver
                      ? `${result.driver.given_name} ${result.driver.family_name}`
                      : "--"}
                  </td>
                  <td className="py-2 pr-3">{result.position}</td>
                  <td className="py-2 pr-3">{result.points}</td>
                </tr>
              ))}
              {!results.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="4">
                    No results found for this constructor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
