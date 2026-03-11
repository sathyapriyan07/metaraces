import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StandingsTable from "../components/StandingsTable.jsx";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function SeasonDetails() {
  const { year } = useParams();
  const [season, setSeason] = useState(null);
  const [races, setRaces] = useState([]);
  const [driverStandings, setDriverStandings] = useState([]);
  const [constructorStandings, setConstructorStandings] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const seasonRes = await fetchTable("seasons", {
        filters: { year: Number(year) },
        limit: 1,
      });
      setSeason(seasonRes.data[0]);

      const racesRes = await fetchTable("races", {
        filters: { season_year: Number(year) },
        order: { column: "round", ascending: true },
      });
      setRaces(racesRes.data);

      const driversRes = await fetchTable("driver_standings", {
        filters: { season_year: Number(year) },
        order: { column: "position", ascending: true },
      });
      setDriverStandings(driversRes.data);

      const constructorsRes = await fetchTable("constructor_standings", {
        filters: { season_year: Number(year) },
        order: { column: "position", ascending: true },
      });
      setConstructorStandings(constructorsRes.data);
    };
    load();
  }, [year]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Season
          </p>
          <h1 className="font-f1wide text-4xl">{year}</h1>
        </div>
        <Link
          to="/seasons"
          className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
        >
          Back to seasons
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            Champion Driver
          </div>
          <div className="mt-3 font-display text-xl">
            {season?.champion_driver_id || "TBD"}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            Champion Constructor
          </div>
          <div className="mt-3 font-display text-xl">
            {season?.champion_constructor_id || "TBD"}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            Total Races
          </div>
          <div className="mt-3 font-display text-xl">
            {season?.total_races || races.length || "--"}
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Race Calendar</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Round</th>
                <th className="py-2 pr-3">Race</th>
                <th className="py-2 pr-3">Circuit</th>
                <th className="py-2 pr-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => (
                <tr key={race.race_id} className="border-t border-white/5">
                  <td className="py-2 pr-3">{race.round}</td>
                  <td className="py-2 pr-3">{race.race_name}</td>
                  <td className="py-2 pr-3">{race.circuit_id}</td>
                  <td className="py-2 pr-3">{race.date}</td>
                </tr>
              ))}
              {!races.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="4">
                    No race data yet. Import from Excel or API.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <StandingsTable title="Driver Standings" rows={driverStandings} />
        <StandingsTable
          title="Constructor Standings"
          rows={constructorStandings}
          type="constructor"
        />
      </section>
    </div>
  );
}
