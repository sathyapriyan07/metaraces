import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StandingsTable from "../components/StandingsTable.jsx";
import { fetchTable, hasSupabase, supabase } from "../services/supabaseClient";
import {
  getConstructorStandings,
  getDriverStandings,
  getSeasonRaces,
} from "../services/ergastService";
import {
  mapErgastConstructorStandings,
  mapErgastDriverStandings,
  mapErgastRaceCircuits,
  mapErgastRaces,
} from "../services/ergastMapper";

export default function SeasonDetails() {
  const { year } = useParams();
  const [season, setSeason] = useState(null);
  const [races, setRaces] = useState([]);
  const [driverStandings, setDriverStandings] = useState([]);
  const [constructorStandings, setConstructorStandings] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const seasonYear = Number(year);
      let seasonRow = null;
      let racesRows = [];

      if (hasSupabase()) {
        const seasonRes = await fetchTable("seasons", {
          filters: { year: seasonYear },
          limit: 1,
        });
        seasonRow = seasonRes.data[0] || null;
        if (!cancelled && seasonRow) setSeason(seasonRow);

        const racesRes = await fetchTable("races", {
          filters: { season_year: seasonYear },
          order: { column: "round", ascending: true },
        });
        racesRows = racesRes.data || [];
      }

      if (racesRows.length) {
        if (!cancelled) setRaces(racesRows);
      } else {
        try {
          const ergastRaces = await getSeasonRaces(seasonYear);
          const mappedRaces = mapErgastRaces(ergastRaces);
          racesRows = mappedRaces;
          if (!cancelled) setRaces(mappedRaces);
          if (hasSupabase() && mappedRaces.length) {
            const circuitRows = mapErgastRaceCircuits(ergastRaces);
            if (circuitRows.length) {
              await supabase.from("circuits").upsert(circuitRows, {
                onConflict: "circuit_id",
              });
            }
            await supabase.from("races").upsert(mappedRaces, {
              onConflict: "race_id",
            });
          }
        } catch {
          if (!cancelled) setRaces([]);
        }
      }

      let driverRows = [];
      if (hasSupabase()) {
        const driversRes = await fetchTable("driver_standings", {
          filters: { season_year: seasonYear },
          order: { column: "position", ascending: true },
        });
        driverRows = driversRes.data || [];
        if (driverRows.length && !cancelled) {
          setDriverStandings(driverRows);
        }
      }

      if (!driverRows.length) {
        try {
          const ergastDriverStandings = await getDriverStandings(seasonYear);
          const mapped = mapErgastDriverStandings(
            ergastDriverStandings,
            seasonYear
          );
          if (!cancelled) setDriverStandings(mapped);
          if (hasSupabase() && mapped.length) {
            await supabase.from("driver_standings").upsert(mapped, {
              onConflict: "id",
            });
          }
        } catch {
          if (!cancelled) setDriverStandings([]);
        }
      }

      let constructorRows = [];
      if (hasSupabase()) {
        const constructorsRes = await fetchTable("constructor_standings", {
          filters: { season_year: seasonYear },
          order: { column: "position", ascending: true },
        });
        constructorRows = constructorsRes.data || [];
        if (constructorRows.length && !cancelled) {
          setConstructorStandings(constructorRows);
        }
      }

      if (!constructorRows.length) {
        try {
          const ergastConstructorStandings =
            await getConstructorStandings(seasonYear);
          const mapped = mapErgastConstructorStandings(
            ergastConstructorStandings,
            seasonYear
          );
          if (!cancelled) setConstructorStandings(mapped);
          if (hasSupabase() && mapped.length) {
            await supabase.from("constructor_standings").upsert(mapped, {
              onConflict: "id",
            });
          }
        } catch {
          if (!cancelled) setConstructorStandings([]);
        }
      }

      if (!seasonRow) {
        const fallbackSeason = {
          season_id: String(seasonYear),
          year: seasonYear,
          champion_driver_id: null,
          champion_constructor_id: null,
          total_races: racesRows.length || null,
        };
        if (!cancelled) setSeason(fallbackSeason);
        if (hasSupabase() && racesRows.length) {
          await supabase.from("seasons").upsert([fallbackSeason], {
            onConflict: "season_id",
          });
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
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
