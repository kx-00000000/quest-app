-- Enable PostGIS for geospatial features
create extension if not exists postgis;

-- 1. Users Table
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  language_pref text default 'ja' check (language_pref in ('ja', 'en')),
  created_at timestamptz default now()
);

-- 2. Plans Table (The Quest Definition)
create table public.plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  center_lat float8 not null,
  center_lng float8 not null,
  radius_km float8 not null,
  item_count int not null,
  created_at timestamptz default now()
);

-- Index for users queries
create index plans_user_id_idx on public.plans(user_id);

-- 3. Items Table (The Targets)
create table public.items (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.plans(id) on delete cascade not null,
  lat float8 not null,
  lng float8 not null,
  is_collected boolean default false,
  land_name text, -- Optional reverse-geocoded name
  created_at timestamptz default now()
);

-- Geospatial Index for items (using PostGIS geometry if needed, or simple lat/lng index)
create index items_plan_id_idx on public.items(plan_id);
-- If using PostGIS geometry column in future: 
-- alter table public.items add column location geometry(Point, 4326);
-- update public.items set location = ST_SetSRID(ST_MakePoint(lng, lat), 4326);
-- create index items_location_idx on public.items using gist(location);

-- 4. Adventures Table (The Play Session)
create table public.adventures (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  plan_id uuid references public.plans(id) not null,
  status text check (status in ('ready', 'active', 'paused', 'completed')) default 'ready',
  total_distance float8 default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index adventures_user_id_idx on public.adventures(user_id);
create index adventures_status_idx on public.adventures(status);

-- RLS Policies (Simple start, secure later)
alter table public.users enable row level security;
alter table public.plans enable row level security;
alter table public.items enable row level security;
alter table public.adventures enable row level security;

-- Allow users to read/write their own data
create policy "Users can crud their own users" on public.users
  for all using (auth.uid() = id);

create policy "Users can crud their own plans" on public.plans
  for all using (auth.uid() = user_id);

create policy "Users can crud their own items" on public.items
  for all using (
    exists (select 1 from public.plans where id = items.plan_id and user_id = auth.uid())
  );

create policy "Users can crud their own adventures" on public.adventures
  for all using (auth.uid() = user_id);
