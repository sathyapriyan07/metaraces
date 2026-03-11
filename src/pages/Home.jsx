import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DriverCard from "../components/DriverCard.jsx";
import TeamCard from "../components/TeamCard.jsx";
import RaceCard from "../components/RaceCard.jsx";
import StandingsTable from "../components/StandingsTable.jsx";
import { fetchTable, hasSupabase, supabase } from "../services/supabaseClient";

export default function Home() {
  const [drivers, setDrivers] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [races, setRaces] = useState([]);
  const [driverStandings, setDriverStandings] = useState([]);
  const [constructorStandings, setConstructorStandings] = useState([]);
  const [seasonLinks, setSeasonLinks] = useState([]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const load = async () => {
      const driversRes = await fetchTable("drivers", {
        order: { column: "created_at", ascending: false },
        limit: 3,
      });
      if (driversRes.data.length) setDrivers(driversRes.data);

      const constructorsRes = await fetchTable("constructors", {
        order: { column: "created_at", ascending: false },
        limit: 3,
      });
      if (constructorsRes.data.length) setConstructors(constructorsRes.data);

      const { data: raceRows } = await supabase
        .from("races")
        .select("race_id, round, season_year, name, date, circuit:circuits(name)")
        .order("date", { ascending: false })
        .limit(3);
      if (raceRows?.length) setRaces(raceRows);

      const { data: driverRows } = await supabase
        .from("driver_standings")
        .select("position, points, wins, driver:drivers(given_name,family_name,driver_id)")
        .order("position", { ascending: true })
        .limit(5);
      if (driverRows?.length) setDriverStandings(driverRows);

      const { data: constructorRows } = await supabase
        .from("constructor_standings")
        .select("position, points, wins, constructor:constructors(name,constructor_id)")
        .order("position", { ascending: true })
        .limit(5);
      if (constructorRows?.length) setConstructorStandings(constructorRows);

      const seasonsRes = await fetchTable("seasons", {
        order: { column: "year", ascending: false },
        limit: 12,
      });
      if (seasonsRes.data.length) setSeasonLinks(seasonsRes.data);
    };
    load();
  }, []);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-black/80 p-8 md:p-12">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
            alt="F1 car"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60 font-f1">
            FIA Formula One Archive
          </p>
          <h1 className="mt-4 font-f1wide text-4xl uppercase tracking-[0.12em] md:text-5xl">
            A living history of Formula One.
          </h1>
          <p className="mt-4 text-sm text-white/70 font-f1">
            Explore every season from 1950 to today. Track champions, legendary
            circuits, and race-by-race results with precision built for
            enthusiasts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/seasons"
              className="rounded-full bg-f1red px-6 py-3 text-xs uppercase tracking-[0.2em] text-white shadow-glow"
            >
              Explore seasons
            </Link>
            <Link
              to="/drivers"
              className="rounded-full border border-white/30 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white/80"
            >
              Featured drivers
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-f1bold text-2xl">Featured Drivers</h2>
            <Link to="/drivers" className="text-xs text-f1red">
              See all
            </Link>
          </div>
          <div className="mt-4 grid gap-4">
            {drivers.length ? (
              drivers.map((driver) => (
                <DriverCard key={driver.driver_id} driver={driver} />
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                No drivers imported yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-f1bold text-2xl">Featured Constructors</h2>
            <Link to="/constructors" className="text-xs text-f1red">
              See all
            </Link>
          </div>
          <div className="mt-4 grid gap-4">
            {constructors.length ? (
              constructors.map((team) => (
                <TeamCard key={team.constructor_id} team={team} />
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                No constructors imported yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-f1bold text-2xl">Latest Race Results</h2>
            <Link to="/races" className="text-xs text-f1red">
              Full calendar
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {races.length ? (
              races.map((race) => <RaceCard key={race.race_id} race={race} />)
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                No races imported yet.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {driverStandings.length ? (
            <StandingsTable title="Driver Standings" rows={driverStandings} />
          ) : (
            <div className="glass-panel rounded-2xl p-4 text-sm text-white/60">
              No driver standings imported yet.
            </div>
          )}
          {constructorStandings.length ? (
            <StandingsTable
              title="Constructor Standings"
              rows={constructorStandings}
              type="constructor"
            />
          ) : (
            <div className="glass-panel rounded-2xl p-4 text-sm text-white/60">
              No constructor standings imported yet.
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-f1bold text-2xl">Season Archive</h2>
          <p className="text-sm text-white/60 font-f1">
            Jump directly to any championship year from 1950 onward.
          </p>
        </div>
          <Link
            to="/seasons"
            className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            Browse seasons
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          {seasonLinks.length ? (
            seasonLinks.map((season) => (
              <Link
                key={season.year}
                to={`/seasons/${season.year}`}
                className="rounded-full border border-white/15 px-4 py-2 text-white/70 hover:text-white"
              >
                {season.year}
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white/60">
              No seasons imported yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
