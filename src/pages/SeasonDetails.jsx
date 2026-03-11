import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StandingsTable from "../components/StandingsTable.jsx";
import { fetchTable, hasSupabase, supabase } from "../services/supabaseClient";

export default function SeasonDetails() {
  const { year } = useParams();
  const [season, setSeason] = useState(null);
  const [races, setRaces] = useState([]);
  const [driverStandings, setDriverStandings] = useState([]);
  const [constructorStandings, setConstructorStandings] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const seasonYear = Number(year);
      const seasonRes = await fetchTable("seasons", {
        filters: { year: seasonYear },
        limit: 1,
      });
      setSeason(seasonRes.data[0] || null);

      const { data: raceRows } = await supabase
        .from("races")
        .select("race_id, round, name, date, circuit:circuits(name,circuit_id)")
        .eq("season_year", seasonYear)
        .order("round", { ascending: true });
      setRaces(raceRows || []);

      const { data: driverRows } = await supabase
        .from("driver_standings")
        .select("position, points, wins, driver:drivers(given_name,family_name,driver_id)")
        .eq("season_year", seasonYear)
        .order("position", { ascending: true });
      setDriverStandings(driverRows || []);

      const { data: constructorRows } = await supabase
        .from("constructor_standings")
        .select("position, points, wins, constructor:constructors(name,constructor_id)")
        .eq("season_year", seasonYear)
        .order("position", { ascending: true });
      setConstructorStandings(constructorRows || []);
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
            {"--"}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            Champion Constructor
          </div>
          <div className="mt-3 font-display text-xl">
            {"--"}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            Total Races
          </div>
          <div className="mt-3 font-display text-xl">
            {races.length || "--"}
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
                  <td className="py-2 pr-3">{race.name}</td>
                  <td className="py-2 pr-3">
                    {race.circuit?.name || race.circuit?.circuit_id || "--"}
                  </td>
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
