-- ============================================================
-- AuroraGuard core schema (migration 0001)
-- Tables: profiles, db_connections, queries, metrics, alerts, optimizations
-- Includes enums, indexes, RLS policies, and the new-user profile trigger.
-- Applied to Supabase. Kept in source control for reproducibility and for
-- the future AWS Aurora migration (see docs/MIGRATION-AWS.md).
-- ============================================================

-- Enums -------------------------------------------------------
do $$ begin
  create type plan_tier as enum ('free', 'pro', 'enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type db_engine as enum ('postgres', 'mysql', 'aurora-postgres', 'aurora-mysql', 'supabase');
exception when duplicate_object then null; end $$;

do $$ begin
  create type connection_status as enum ('healthy', 'degraded', 'down', 'connecting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type query_status as enum ('healthy', 'slow', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_severity as enum ('info', 'warning', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_status as enum ('open', 'acknowledged', 'resolved');
exception when duplicate_object then null; end $$;

-- profiles ----------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  plan plan_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- db_connections ---------------------------------------------
create table if not exists public.db_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  engine db_engine not null default 'postgres',
  host text not null,
  port integer not null default 5432,
  database_name text not null,
  environment text not null default 'production',
  region text not null default 'us-east-1',
  status connection_status not null default 'connecting',
  ssl_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.db_connections enable row level security;
create index if not exists idx_connections_user on public.db_connections(user_id);

-- queries -----------------------------------------------------
create table if not exists public.queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.db_connections(id) on delete cascade,
  query_text text not null,
  query_hash text not null,
  calls bigint not null default 0,
  mean_exec_ms numeric(12,2) not null default 0,
  total_exec_ms numeric(14,2) not null default 0,
  rows_read bigint not null default 0,
  status query_status not null default 'healthy',
  captured_at timestamptz not null default now()
);
alter table public.queries enable row level security;
create index if not exists idx_queries_user on public.queries(user_id);
create index if not exists idx_queries_connection on public.queries(connection_id);
create index if not exists idx_queries_status on public.queries(status);

-- metrics (time series) --------------------------------------
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.db_connections(id) on delete cascade,
  ts timestamptz not null default now(),
  cpu_pct numeric(5,2) not null default 0,
  active_connections integer not null default 0,
  qps numeric(10,2) not null default 0,
  latency_p95_ms numeric(10,2) not null default 0,
  cache_hit_ratio numeric(5,2) not null default 0,
  storage_gb numeric(10,2) not null default 0
);
alter table public.metrics enable row level security;
create index if not exists idx_metrics_conn_ts on public.metrics(connection_id, ts);

-- alerts ------------------------------------------------------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.db_connections(id) on delete cascade,
  severity alert_severity not null default 'info',
  status alert_status not null default 'open',
  title text not null,
  description text,
  metric text,
  threshold numeric(12,2),
  observed_value numeric(12,2),
  created_at timestamptz not null default now()
);
alter table public.alerts enable row level security;
create index if not exists idx_alerts_user on public.alerts(user_id);
create index if not exists idx_alerts_status on public.alerts(status);

-- optimizations ----------------------------------------------
create table if not exists public.optimizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query_id uuid references public.queries(id) on delete set null,
  original_query text not null,
  optimized_query text,
  recommendation text,
  estimated_improvement_pct numeric(5,2),
  model text,
  created_at timestamptz not null default now()
);
alter table public.optimizations enable row level security;
create index if not exists idx_optimizations_user on public.optimizations(user_id);

-- RLS policies: owner-scoped CRUD on every table -------------
do $$
declare t text;
begin
  foreach t in array array['profiles','db_connections','queries','metrics','alerts','optimizations']
  loop
    if t = 'profiles' then
      execute format('drop policy if exists "%1$s_select" on public.%1$s;', t);
      execute format('create policy "%1$s_select" on public.%1$s for select using (auth.uid() = id);', t);
      execute format('drop policy if exists "%1$s_insert" on public.%1$s;', t);
      execute format('create policy "%1$s_insert" on public.%1$s for insert with check (auth.uid() = id);', t);
      execute format('drop policy if exists "%1$s_update" on public.%1$s;', t);
      execute format('create policy "%1$s_update" on public.%1$s for update using (auth.uid() = id);', t);
      execute format('drop policy if exists "%1$s_delete" on public.%1$s;', t);
      execute format('create policy "%1$s_delete" on public.%1$s for delete using (auth.uid() = id);', t);
    else
      execute format('drop policy if exists "%1$s_select" on public.%1$s;', t);
      execute format('create policy "%1$s_select" on public.%1$s for select using (auth.uid() = user_id);', t);
      execute format('drop policy if exists "%1$s_insert" on public.%1$s;', t);
      execute format('create policy "%1$s_insert" on public.%1$s for insert with check (auth.uid() = user_id);', t);
      execute format('drop policy if exists "%1$s_update" on public.%1$s;', t);
      execute format('create policy "%1$s_update" on public.%1$s for update using (auth.uid() = user_id);', t);
      execute format('drop policy if exists "%1$s_delete" on public.%1$s;', t);
      execute format('create policy "%1$s_delete" on public.%1$s for delete using (auth.uid() = user_id);', t);
    end if;
  end loop;
end $$;

-- new-user trigger: auto create profile ----------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, company)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'company', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
