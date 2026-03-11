import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTable, hasSupabase, supabase } from "../services/supabaseClient";

export default function ConstructorDetails() {
  const { constructorId } = useParams();
  const [team, setTeam] = useState(null);
  const [results, setResults] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [seasonOptions, setSeasonOptions] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [assignedDrivers, setAssignedDrivers] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const teamRes = await fetchTable("constructors", {
        filters: { constructor_id: constructorId },
        limit: 1,
      });
      setTeam(teamRes.data[0]);

      const resultsRes = await fetchTable("results", {
        filters: { constructor_id: constructorId },
        order: { column: "race_id", ascending: false },
        limit: 20,
      });
      setResults(resultsRes.data);

      const driversRes = await fetchTable("results", {
        filters: { constructor_id: constructorId },
      });
      const uniqueDrivers = Array.from(
        new Set(driversRes.data.map((item) => item.driver_id))
      );
      setDrivers(uniqueDrivers);

      const assignmentsRes = await fetchTable("driver_constructor_contracts", {
        filters: { constructor_id: constructorId },
        order: { column: "season_year", ascending: false },
      });
      const assignmentRows = assignmentsRes.data || [];
      setAssignments(assignmentRows);
      const seasons = Array.from(
        new Set(assignmentRows.map((row) => row.season_year))
      ).sort((a, b) => b - a);
      setSeasonOptions(seasons);
      if (seasons.length) setSelectedSeason(seasons[0]);
    };
    load();
  }, [constructorId]);

  useEffect(() => {
    if (!hasSupabase()) return;
    if (!selectedSeason) {
      setAssignedDrivers([]);
      return;
    }
    const loadDrivers = async () => {
      const seasonAssignments = assignments.filter(
        (row) => row.season_year === selectedSeason
      );
      const driverIds = seasonAssignments.map((row) => row.driver_id);
      if (!driverIds.length) {
        setAssignedDrivers([]);
        return;
      }
      const { data: driverRows } = await supabase
        .from("drivers")
        .select("*")
        .in("driver_id", driverIds);
      const driverMap = new Map(
        (driverRows || []).map((driver) => [driver.driver_id, driver])
      );
      const enriched = seasonAssignments
        .map((row) => ({
          ...row,
          driver: driverMap.get(row.driver_id),
        }))
        .filter((row) => row.driver);
      setAssignedDrivers(enriched);
    };
    loadDrivers();
  }, [assignments, selectedSeason]);

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
              <div>Base: {team.base_location || "—"}</div>
              <div>Championships: {team.championships || 0}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {drivers.map((driver) => (
                <span
                  key={driver}
                  className="rounded-full border border-white/20 px-3 py-1 text-white/70"
                >
                  {driver}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-f1bold text-2xl">Current Drivers</h2>
          {seasonOptions.length ? (
            <select
              value={selectedSeason || ""}
              onChange={(event) => setSelectedSeason(Number(event.target.value))}
              className="rounded-full border border-white/20 bg-black/80 px-4 py-2 text-xs text-white"
            >
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-white/50">No seasons</span>
          )}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignedDrivers.length ? (
            assignedDrivers.map((row) => (
              <div
                key={`${row.driver_id}-${row.season_year}`}
                className="glass-panel rounded-2xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/5">
                    {row.driver?.photo_url ? (
                      <img
                        src={row.driver.photo_url}
                        alt={row.driver.first_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
                        No photo
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-f1bold text-lg">
                      {row.driver?.first_name} {row.driver?.last_name}
                    </div>
                    <div className="text-xs text-white/60">
                      {row.driver?.nationality}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/60">
                  Number: {row.driver_number || "—"}
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel rounded-2xl p-6 text-white/60">
              No drivers assigned to this constructor for the selected season.
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Season Results</h2>
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
              {results.map((result) => (
                <tr key={result.result_id} className="border-t border-white/5">
                  <td className="py-2 pr-3">{result.race_id}</td>
                  <td className="py-2 pr-3">{result.driver_id}</td>
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
