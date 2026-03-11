-- Schema suggestions for Ergast optional imports

create table if not exists public.qualifying_results (
  id text primary key,
  race_id text not null references public.races (race_id) on delete cascade,
  driver_id text references public.drivers (driver_id) on delete set null,
  constructor_id text references public.constructors (constructor_id) on delete set null,
  position integer,
  q1 text,
  q2 text,
  q3 text,
  created_at timestamptz default now()
);

create index if not exists qualifying_results_race_id_idx
  on public.qualifying_results (race_id);

create index if not exists qualifying_results_driver_id_idx
  on public.qualifying_results (driver_id);

create table if not exists public.fastest_laps (
  id text primary key,
  race_id text not null references public.races (race_id) on delete cascade,
  driver_id text references public.drivers (driver_id) on delete set null,
  constructor_id text references public.constructors (constructor_id) on delete set null,
  lap integer,
  time text,
  average_speed numeric,
  average_speed_units text,
  position integer,
  points numeric,
  created_at timestamptz default now()
);

create index if not exists fastest_laps_race_id_idx
  on public.fastest_laps (race_id);

create index if not exists fastest_laps_driver_id_idx
  on public.fastest_laps (driver_id);
