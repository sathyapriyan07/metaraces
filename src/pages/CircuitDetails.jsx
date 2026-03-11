import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { hasSupabase, supabase } from "../services/supabaseClient";

export default function CircuitDetails() {
  const { circuitId } = useParams();
  const [circuit, setCircuit] = useState(null);
  const [races, setRaces] = useState([]);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const { data: circuitRow } = await supabase
        .from("circuits")
        .select("*")
        .eq("circuit_id", circuitId)
        .limit(1)
        .maybeSingle();
      setCircuit(circuitRow || null);
      if (!circuitRow) {
        setRaces([]);
        setWinners([]);
        return;
      }

      const { data: raceRows } = await supabase
        .from("races")
        .select("id, race_id, name, season_year, round, date")
        .eq("circuit_id", circuitRow.id)
        .order("season_year", { ascending: false });
      setRaces(raceRows || []);

      if (raceRows?.length) {
        const raceIds = raceRows.map((race) => race.id);
        const { data: winnerRows } = await supabase
          .from("race_winners")
          .select(
            "race_id, race_name, season_year, round, driver_id, given_name, family_name"
          )
          .in("race_id", raceIds);
        setWinners(winnerRows || []);
      } else {
        setWinners([]);
      }
    };
    load();
  }, [circuitId]);

  if (!circuit) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-white/70">
        Circuit profile not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-white/5">
            {circuit.map_url ? (
              <img
                src={circuit.map_url}
                alt={circuit.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                No track map available
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Circuit
            </p>
            <h1 className="mt-3 font-f1bold text-3xl">{circuit.name}</h1>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <div>
                Location: {circuit.locality || "--"}, {circuit.country || "--"}
              </div>
              <div>Latitude: {circuit.lat || "--"}</div>
              <div>Longitude: {circuit.lng || "--"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Races Held</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Season</th>
                <th className="py-2 pr-3">Race</th>
                <th className="py-2 pr-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => (
                <tr key={race.race_id} className="border-t border-white/5">
                  <td className="py-2 pr-3">{race.season_year}</td>
                  <td className="py-2 pr-3">{race.name}</td>
                  <td className="py-2 pr-3">{race.date}</td>
                </tr>
              ))}
              {!races.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="3">
                    No races recorded for this circuit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-f1bold text-2xl">Race Winners</h2>
        <div className="mt-4 overflow-x-auto scrollbar-hidden">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-2 pr-3">Season</th>
                <th className="py-2 pr-3">Race</th>
                <th className="py-2 pr-3">Winner</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((row, index) => (
                <tr key={`${row.race_id}-${index}`} className="border-t border-white/5">
                  <td className="py-2 pr-3">{row.season_year || "--"}</td>
                  <td className="py-2 pr-3">{row.race_name || "--"}</td>
                  <td className="py-2 pr-3">
                    {row.given_name
                      ? `${row.given_name} ${row.family_name}`
                      : "--"}
                  </td>
                </tr>
              ))}
              {!winners.length && (
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 text-white/50" colSpan="3">
                    No winners recorded for this circuit.
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
