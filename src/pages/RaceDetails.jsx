import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTable, hasSupabase } from "../services/supabaseClient";

export default function RaceDetails() {
  const { raceId } = useParams();
  const [race, setRace] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const raceRes = await fetchTable("races", {
        filters: { race_id: raceId },
        limit: 1,
      });
      setRace(raceRes.data[0]);

      const resultsRes = await fetchTable("results", {
        filters: { race_id: raceId },
        order: { column: "position", ascending: true },
      });
      setResults(resultsRes.data);
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
          {race.banner_url ? (
            <img
              src={race.banner_url}
              alt={race.race_name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
              No banner available
            </div>
          )}
        </div>
        <div className="p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            {race.season_year} · Round {race.round}
          </p>
          <h1 className="mt-2 font-f1bold text-3xl">{race.race_name}</h1>
          <p className="mt-2 text-sm text-white/60">
            Circuit: {race.circuit_id} · {race.date}
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
                <tr key={result.result_id} className="border-t border-white/5">
                  <td className="py-2 pr-3">{result.position}</td>
                  <td className="py-2 pr-3">{result.driver_id}</td>
                  <td className="py-2 pr-3">{result.constructor_id}</td>
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
    </div>
  );
}
