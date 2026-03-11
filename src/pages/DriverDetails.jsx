import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTable, hasSupabase, supabase } from "../services/supabaseClient";

export default function DriverDetails() {
  const { driverId } = useParams();
  const [driver, setDriver] = useState(null);
  const [results, setResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamHistory, setTeamHistory] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const driverRes = await fetchTable("drivers", {
        filters: { driver_id: driverId },
        limit: 1,
      });
      setDriver(driverRes.data[0]);

      const resultsRes = await fetchTable("results", {
        filters: { driver_id: driverId },
        order: { column: "race_id", ascending: false },
        limit: 20,
      });
      setResults(resultsRes.data);

      const teamsRes = await fetchTable("results", {
        filters: { driver_id: driverId },
      });
      const uniqueTeams = Array.from(
        new Set(teamsRes.data.map((item) => item.constructor_id))
      );
      setTeams(uniqueTeams);

      const assignmentsRes = await fetchTable("driver_constructor_contracts", {
        filters: { driver_id: driverId },
        order: { column: "season_year", ascending: false },
      });
      const assignments = assignmentsRes.data || [];
      const constructorIds = Array.from(
        new Set(assignments.map((row) => row.constructor_id))
      );
      const { data: constructorRows } = await supabase
        .from("constructors")
        .select("*")
        .in("constructor_id", constructorIds);
      const constructorMap = new Map(
        (constructorRows || []).map((team) => [team.constructor_id, team])
      );
      const grouped = constructorIds.map((id) => {
        const seasons = assignments
          .filter((row) => row.constructor_id === id)
          .map((row) => row.season_year)
          .filter(Boolean);
        return {
          constructor: constructorMap.get(id),
          seasons,
        };
      });
      setTeamHistory(grouped.filter((item) => item.constructor));
    };
    load();
  }, [driverId]);

  if (!driver) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-white/70">
        Driver profile not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-2xl bg-white/5">
            {driver.photo_url ? (
              <img
                src={driver.photo_url}
                alt={`${driver.first_name} ${driver.last_name}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                No photo available
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Driver Profile
            </p>
            <h1 className="mt-3 font-f1bold text-3xl">
              {driver.first_name} {driver.last_name}
            </h1>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <div>Nationality: {driver.nationality}</div>
              <div>Date of Birth: {driver.date_of_birth}</div>
              <div>Number: {driver.number || "—"}</div>
              <div>Debut: {driver.debut_year || "—"}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {teams.map((team) => (
                <span
                  key={team}
                  className="rounded-full border border-white/20 px-3 py-1 text-white/70"
                >
                  {team}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Teams Driven For</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {teamHistory.length ? (
            teamHistory.map((item) => (
              <div
                key={item.constructor.constructor_id}
                className="rounded-2xl border border-white/10 bg-black/80 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/5 p-2">
                    {item.constructor.logo_url ? (
                      <img
                        src={item.constructor.logo_url}
                        alt={item.constructor.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
                        No logo
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-f1bold text-lg">
                      {item.constructor.name}
                    </div>
                    <div className="text-xs text-white/60">
                      Seasons: {item.seasons.join(", ") || "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/80 p-4 text-sm text-white/60">
              No constructor assignments found for this driver.
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Season Performance</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Race</th>
                <th className="py-2 pr-3">Grid</th>
                <th className="py-2 pr-3">Finish</th>
                <th className="py-2 pr-3">Points</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.result_id} className="border-t border-white/5">
                  <td className="py-2 pr-3">{result.race_id}</td>
                  <td className="py-2 pr-3">{result.grid}</td>
                  <td className="py-2 pr-3">{result.position}</td>
                  <td className="py-2 pr-3">{result.points}</td>
                  <td className="py-2 pr-3">{result.status}</td>
                </tr>
              ))}
              {!results.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="5">
                    No results found for this driver.
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
