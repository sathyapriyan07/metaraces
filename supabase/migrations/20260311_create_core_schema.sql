-- Core relational schema for Formula One archive

create extension if not exists "pgcrypto";

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  url text,
  created_at timestamptz default now()
);

create table if not exists public.circuits (
  id uuid primary key default gen_random_uuid(),
  circuit_id text not null unique,
  name text not null,
  locality text,
  country text,
  lat numeric,
  lng numeric,
  url text,
  map_url text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists public.constructors (
  id uuid primary key default gen_random_uuid(),
  constructor_id text not null unique,
  name text not null,
  nationality text,
  logo_url text,
  url text,
  created_at timestamptz default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  driver_id text not null unique,
  code text,
  given_name text,
  family_name text,
  date_of_birth date,
  nationality text,
  permanent_number integer,
  photo_url text,
  url text,
  created_at timestamptz default now()
);

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  race_id text not null unique,
  season_year integer not null references public.seasons (year) on delete cascade,
  round integer,
  circuit_id uuid references public.circuits (id) on delete set null,
  name text not null,
  date date,
  time text,
  url text,
  created_at timestamptz default now(),
  unique (season_year, round)
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  constructor_id uuid references public.constructors (id) on delete set null,
  grid integer,
  position integer,
  position_text text,
  status text,
  points numeric,
  laps integer,
  time text,
  fastest_lap_rank integer,
  fastest_lap_time text,
  fastest_lap_speed numeric,
  created_at timestamptz default now()
);

create table if not exists public.qualifying (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  constructor_id uuid references public.constructors (id) on delete set null,
  q1 text,
  q2 text,
  q3 text,
  position integer,
  created_at timestamptz default now(),
  unique (race_id, driver_id)
);

create table if not exists public.pitstops (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  stop integer,
  lap integer,
  time text,
  duration text,
  created_at timestamptz default now(),
  unique (race_id, driver_id, stop)
);

create table if not exists public.driver_constructor_history (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id) on delete cascade,
  constructor_id uuid not null references public.constructors (id) on delete cascade,
  season_year integer not null references public.seasons (year) on delete cascade,
  race_id uuid references public.races (id) on delete set null,
  round integer,
  start_round integer,
  end_round integer,
  created_at timestamptz default now(),
  unique (driver_id, constructor_id, season_year, race_id)
);

create table if not exists public.driver_standings (
  id uuid primary key default gen_random_uuid(),
  season_year integer not null references public.seasons (year) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  points numeric,
  wins integer,
  position integer,
  created_at timestamptz default now(),
  unique (season_year, driver_id)
);

create table if not exists public.constructor_standings (
  id uuid primary key default gen_random_uuid(),
  season_year integer not null references public.seasons (year) on delete cascade,
  constructor_id uuid not null references public.constructors (id) on delete cascade,
  points numeric,
  wins integer,
  position integer,
  created_at timestamptz default now(),
  unique (season_year, constructor_id)
);

create index if not exists drivers_driver_id_idx on public.drivers (driver_id);
create index if not exists constructors_constructor_id_idx on public.constructors (constructor_id);
create index if not exists circuits_circuit_id_idx on public.circuits (circuit_id);
create index if not exists races_season_year_idx on public.races (season_year);
create index if not exists results_race_id_idx on public.results (race_id);
create index if not exists results_driver_id_idx on public.results (driver_id);
create index if not exists results_constructor_id_idx on public.results (constructor_id);
create index if not exists driver_constructor_history_constructor_idx on public.driver_constructor_history (constructor_id);
create index if not exists driver_constructor_history_driver_idx on public.driver_constructor_history (driver_id);

alter table public.results
  drop constraint if exists results_unique;

alter table public.results
  add constraint results_unique unique (race_id, driver_id);

create or replace view public.driver_career_stats as
select
  d.id as driver_id,
  d.driver_id as driver_code,
  d.given_name,
  d.family_name,
  count(res.id) as races,
  sum(case when res.position = 1 then 1 else 0 end) as wins,
  sum(case when res.position <= 3 then 1 else 0 end) as podiums,
  sum(case when res.grid = 1 then 1 else 0 end) as poles,
  sum(case when res.fastest_lap_rank = 1 then 1 else 0 end) as fastest_laps,
  coalesce(sum(res.points), 0) as total_points,
  count(distinct r.season_year) as seasons_active,
  string_agg(distinct c.name, ', ' order by c.name) as teams
from public.drivers d
left join public.results res on res.driver_id = d.id
left join public.races r on res.race_id = r.id
left join public.constructors c on res.constructor_id = c.id
group by d.id, d.driver_id, d.given_name, d.family_name;

create or replace view public.driver_season_stats as
select
  r.season_year,
  res.driver_id,
  res.constructor_id,
  count(*) as races,
  sum(case when res.position = 1 then 1 else 0 end) as wins,
  sum(case when res.position <= 3 then 1 else 0 end) as podiums,
  coalesce(sum(res.points), 0) as points
from public.results res
join public.races r on r.id = res.race_id
group by r.season_year, res.driver_id, res.constructor_id;
