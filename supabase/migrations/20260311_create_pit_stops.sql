-- Schema suggestions for Ergast pit stops import

create table if not exists public.pit_stops (
  id text primary key,
  race_id text not null references public.races (race_id) on delete cascade,
  driver_id text references public.drivers (driver_id) on delete set null,
  stop integer,
  lap integer,
  time text,
  duration text,
  created_at timestamptz default now()
);

create index if not exists pit_stops_race_id_idx
  on public.pit_stops (race_id);

create index if not exists pit_stops_driver_id_idx
  on public.pit_stops (driver_id);
