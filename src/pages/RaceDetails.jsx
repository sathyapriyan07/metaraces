import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { hasSupabase, supabase } from "../services/supabaseClient";

export default function RaceDetails() {
  const { raceId } = useParams();
  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);
  const [qualifying, setQualifying] = useState([]);
  const [pitStops, setPitStops] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const { data: raceRow } = await supabase
        .from("races")
        .select("id, race_id, season_year, round, name, date, circuit:circuits(name,circuit_id)")
        .eq("race_id", raceId)
        .limit(1)
        .maybeSingle();
      setRace(raceRow);

      if (!raceRow) {
        setResults([]);
        setQualifying([]);
        setPitStops([]);
        return;
      }

      const { data: resultsRows } = await supabase
        .from("results")
        .select(
          "grid, position, points, status, driver:drivers(given_name,family_name,driver_id), constructor:constructors(name,constructor_id)"
        )
        .eq("race_id", raceRow.id)
        .order("position", { ascending: true });
      setResults(resultsRows || []);

      const { data: qualifyingRows } = await supabase
        .from("qualifying")
        .select(
          "position, q1, q2, q3, driver:drivers(given_name,family_name,driver_id), constructor:constructors(name,constructor_id)"
        )
        .eq("race_id", raceRow.id)
        .order("position", { ascending: true });
      setQualifying(qualifyingRows || []);

      const { data: pitRows } = await supabase
        .from("pitstops")
        .select(
          "stop, lap, time, duration, driver:drivers(given_name,family_name,driver_id)"
        )
        .eq("race_id", raceRow.id)
        .order("stop", { ascending: true });
      setPitStops(pitRows || []);
    };
    load();
  }, [raceId]);

  if (!race) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-white/70">
        Race data not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl overflow-hidden">
        <div className="h-48 md:h-64">
          <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
            No banner available
          </div>
        </div>
        <div className="p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            {race.season_year} · Round {race.round}
          </p>
          <h1 className="mt-2 font-f1bold text-3xl">{race.name}</h1>
          <p className="mt-2 text-sm text-white/60">
            Circuit: {race.circuit?.name || race.circuit?.circuit_id || "--"} · {race.date}
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Race Results</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Pos</th>
                <th className="py-2 pr-3">Driver</th>
                <th className="py-2 pr-3">Team</th>
                <th className="py-2 pr-3">Grid</th>
                <th className="py-2 pr-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={`${result.driver?.driver_id}-${result.position}`}
                  className="border-t border-white/5"
                >
                  <td className="py-2 pr-3">{result.position}</td>
                  <td className="py-2 pr-3">
                    {result.driver
                      ? `${result.driver.given_name} ${result.driver.family_name}`
                      : "--"}
                  </td>
                  <td className="py-2 pr-3">
                    {result.constructor?.name || "--"}
                  </td>
                  <td className="py-2 pr-3">{result.grid}</td>
                  <td className="py-2 pr-3">{result.points}</td>
                </tr>
              ))}
              {!results.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="5">
                    No results recorded for this race.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Qualifying</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Pos</th>
                <th className="py-2 pr-3">Driver</th>
                <th className="py-2 pr-3">Team</th>
                <th className="py-2 pr-3">Q1</th>
                <th className="py-2 pr-3">Q2</th>
                <th className="py-2 pr-3">Q3</th>
              </tr>
            </thead>
            <tbody>
              {qualifying.map((row) => (
                <tr
                  key={`${row.driver?.driver_id}-${row.position}`}
                  className="border-t border-white/5"
                >
                  <td className="py-2 pr-3">{row.position}</td>
                  <td className="py-2 pr-3">
                    {row.driver
                      ? `${row.driver.given_name} ${row.driver.family_name}`
                      : "--"}
                  </td>
                  <td className="py-2 pr-3">{row.constructor?.name || "--"}</td>
                  <td className="py-2 pr-3">{row.q1 || "--"}</td>
                  <td className="py-2 pr-3">{row.q2 || "--"}</td>
                  <td className="py-2 pr-3">{row.q3 || "--"}</td>
                </tr>
              ))}
              {!qualifying.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="6">
                    No qualifying data recorded for this race.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Pit Stops</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Stop</th>
                <th className="py-2 pr-3">Driver</th>
                <th className="py-2 pr-3">Lap</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {pitStops.map((row) => (
                <tr
                  key={`${row.driver?.driver_id}-${row.stop}`}
                  className="border-t border-white/5"
                >
                  <td className="py-2 pr-3">{row.stop}</td>
                  <td className="py-2 pr-3">
                    {row.driver
                      ? `${row.driver.given_name} ${row.driver.family_name}`
                      : "--"}
                  </td>
                  <td className="py-2 pr-3">{row.lap}</td>
                  <td className="py-2 pr-3">{row.time || "--"}</td>
                  <td className="py-2 pr-3">{row.duration || "--"}</td>
                </tr>
              ))}
              {!pitStops.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="5">
                    No pit stop data recorded for this race.
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
