-- v1 baseline (ADR 0005 clean cut).
-- Drops every object in public and recreates the complete v1 schema with its
-- final RLS and grants. Liquidation logic and its scheduler land in phase 3;
-- the sync RPC lands with sync v2. From this file on, migrations are immutable.

begin;

-- Stop the v1 scheduler before the function it calls disappears.
do $$
declare
  v_job record;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    for v_job in
      select jobid
      from cron.job
      where jobname = 'daily-liquidation-batch'
    loop
      perform cron.unschedule(v_job.jobid);
    end loop;
  end if;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

-- Drop every view, table, routine and type in public, skipping objects owned by
-- an extension.
do $$
declare
  rec record;
begin
  for rec in
    select c.oid::regclass as name, c.relkind
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('v', 'm')
      and not exists (
        select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e'
      )
  loop
    if rec.relkind = 'm' then
      execute format('drop materialized view if exists %s cascade', rec.name);
    else
      execute format('drop view if exists %s cascade', rec.name);
    end if;
  end loop;

  for rec in
    select c.oid::regclass as name
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p')
      and not exists (
        select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e'
      )
  loop
    execute format('drop table if exists %s cascade', rec.name);
  end loop;

  for rec in
    select p.oid::regprocedure as name
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prokind in ('f', 'p')
      and not exists (
        select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('drop routine if exists %s cascade', rec.name);
  end loop;

  for rec in
    select t.oid::regtype as name
    from pg_type t
    where t.typnamespace = 'public'::regnamespace
      and t.typtype in ('e', 'd', 'c')
      and (t.typtype <> 'c' or exists (
        select 1 from pg_class c where c.oid = t.typrelid and c.relkind = 'c'
      ))
      and not exists (
        select 1 from pg_depend d where d.objid = t.oid and d.deptype = 'e'
      )
  loop
    execute format('drop type if exists %s cascade', rec.name);
  end loop;
end;
$$;

-- Types ---------------------------------------------------------------------

create type public.transaction_type as enum ('INCOME', 'EXPENSE');
create type public.castle_status as enum ('HEALTHY', 'UNDER_ATTACK', 'RUINS');
create type public.upgrade_line as enum ('WALLS', 'TOWERS', 'GATE', 'BANNERS');
create type public.notification_type as enum ('STREAK_AT_RISK', 'BUDGET_THRESHOLD', 'BATTLE_REPORT');
create type public.notification_dispatch_status as enum ('PENDING', 'PROCESSING', 'SENT', 'DEAD');

-- Shared trigger -------------------------------------------------------------

-- updated_at is a server audit column only; sync ordering uses version and
-- change_seq (ADR 0005).
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  -- ISO 4217 code chosen in onboarding; null until then, fixed after.
  currency char(3) check (currency ~ '^[A-Z]{3}$'),
  -- IANA zone reported by the device at app start; Days are local to it.
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Accepts IANA zone names only (no POSIX offsets such as 'UTC-5') and keeps
-- the currency fixed once set (read-only in v1).
create function public.validate_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown IANA timezone: %', new.timezone using errcode = '22023';
  end if;

  if tg_op = 'UPDATE' and old.currency is not null and new.currency is distinct from old.currency then
    raise exception 'Currency cannot change once set' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger trg_profiles_validate
before insert or update on public.profiles
for each row execute function public.validate_profile();

-- Categories -----------------------------------------------------------------

-- Fixed set identified by slug (docs/prd/v1.md, Categories); seeded, never
-- synced. UI names live in the app.
create table public.categories (
  slug text primary key check (slug ~ '^[a-z][a-z_]*$'),
  type public.transaction_type not null,
  sort_order smallint not null,
  unique (slug, type)
);

insert into public.categories (slug, type, sort_order)
values
  ('food', 'EXPENSE', 1),
  ('groceries', 'EXPENSE', 2),
  ('transport', 'EXPENSE', 3),
  ('housing', 'EXPENSE', 4),
  ('utilities', 'EXPENSE', 5),
  ('health', 'EXPENSE', 6),
  ('education', 'EXPENSE', 7),
  ('leisure', 'EXPENSE', 8),
  ('shopping', 'EXPENSE', 9),
  ('other_expense', 'EXPENSE', 10),
  ('salary', 'INCOME', 11),
  ('side_income', 'INCOME', 12),
  ('gifts', 'INCOME', 13),
  ('other_income', 'INCOME', 14);

-- Sync v2 bookkeeping (logic lands with the sync RPC) -------------------------

-- One row per user, locked by the writing transaction so commit order equals
-- change_seq order.
create table public.user_change_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_change_seq bigint not null default 0 check (last_change_seq >= 0)
);

-- Applied operationIds per user, so a replay returns the original result.
-- Prunable after 30 days.
create table public.sync_applied_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  entity_type text not null check (entity_type in ('transaction', 'budget_plan', 'day_checkin')),
  entity_key text not null,
  result jsonb not null,
  applied_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);

create index idx_sync_applied_operations_applied_at
  on public.sync_applied_operations (applied_at);

-- Synced entities ------------------------------------------------------------

-- Money is integer minor units of the user's currency (ADR 0005, Values).
create table public.transactions (
  -- Client-generated UUID v4.
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.transaction_type not null,
  amount bigint not null check (amount > 0 and amount <= 100000000000),
  category_slug text not null,
  -- Local calendar Day in the user's timezone.
  day date not null,
  note text,
  version bigint not null default 1 check (version > 0),
  change_seq bigint not null check (change_seq > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (category_slug, type) references public.categories (slug, type)
);

create unique index idx_transactions_user_change_seq
  on public.transactions (user_id, change_seq);
create index idx_transactions_user_day
  on public.transactions (user_id, day)
  where deleted_at is null;

create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

-- A Monthly budget plus its Category limits, synced as one document per user
-- and Effective month.
create table public.budget_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- First day of the first Period the plan applies from.
  effective_month date not null check (extract(day from effective_month) = 1),
  total_budget bigint not null check (total_budget > 0 and total_budget <= 100000000000),
  version bigint not null default 1 check (version > 0),
  change_seq bigint not null check (change_seq > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, effective_month)
);

create unique index idx_budget_plans_user_change_seq
  on public.budget_plans (user_id, change_seq);

create trigger trg_budget_plans_updated_at
before update on public.budget_plans
for each row execute function public.set_updated_at();

-- Category limits of a plan; written only together with their plan.
create table public.budget_plan_limits (
  user_id uuid not null,
  effective_month date not null,
  category_slug text not null,
  category_type public.transaction_type not null default 'EXPENSE' check (category_type = 'EXPENSE'),
  limit_amount bigint not null check (limit_amount > 0 and limit_amount <= 100000000000),
  primary key (user_id, effective_month, category_slug),
  foreign key (user_id, effective_month)
    references public.budget_plans (user_id, effective_month) on delete cascade,
  foreign key (category_slug, category_type) references public.categories (slug, type)
);

-- "Hoy sin gastos": one per user and Day.
create table public.day_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  version bigint not null default 1 check (version > 0),
  change_seq bigint not null check (change_seq > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, day)
);

create unique index idx_day_checkins_user_change_seq
  on public.day_checkins (user_id, change_seq);

create trigger trg_day_checkins_updated_at
before update on public.day_checkins
for each row execute function public.set_updated_at();

-- Game state (written by the server only, ADR 0006) -------------------------

-- Late-entry Streak repair (ADR 0006, R15): the sync RPC records a Day that
-- did not count and received records within 48 h of its Liquidation; the next
-- batch re-evaluates it and sets processed_at.
create table public.streak_repair_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  primary key (user_id, day)
);

create index idx_streak_repair_requests_pending
  on public.streak_repair_requests (requested_at)
  where processed_at is null;

create table public.castle_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hp smallint not null default 100 check (hp between 0 and 100),
  status public.castle_status not null default 'HEALTHY',
  updated_at timestamptz not null default now()
);

create trigger trg_castle_states_updated_at
before update on public.castle_states
for each row execute function public.set_updated_at();

create table public.user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold integer not null default 0 check (gold >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  shields smallint not null default 0 check (shields >= 0),
  updated_at timestamptz not null default now()
);

create trigger trg_user_wallets_updated_at
before update on public.user_wallets
for each row execute function public.set_updated_at();

-- Mejoras owned: one row per purchased line and tier.
create table public.user_upgrades (
  user_id uuid not null references auth.users(id) on delete cascade,
  line public.upgrade_line not null,
  tier smallint not null check (tier between 1 and 3),
  purchased_at timestamptz not null default now(),
  primary key (user_id, line, tier)
);

-- Liquidation ledger: one row per user and Day; each row is a Parte de batalla.
create table public.game_liquidation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  counted boolean not null,
  streak_before integer not null check (streak_before >= 0),
  streak_after integer not null check (streak_after >= 0),
  shield_used boolean not null default false,
  gold_earned integer not null default 0 check (gold_earned >= 0),
  hp smallint not null check (hp between 0 and 100),
  castle_status public.castle_status not null,
  rules_version integer not null check (rules_version > 0),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

-- Notifications --------------------------------------------------------------

-- A push token belongs to at most one user; register_push_token moves it.
create table public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_string text not null unique check (btrim(token_string) <> ''),
  device_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_push_tokens_user_id on public.user_push_tokens (user_id);

create trigger trg_user_push_tokens_updated_at
before update on public.user_push_tokens
for each row execute function public.set_updated_at();

create table public.notification_dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type public.notification_type not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique check (btrim(dedupe_key) <> ''),
  liquidation_event_id uuid references public.game_liquidation_events(id) on delete set null,
  send_after timestamptz not null,
  status public.notification_dispatch_status not null default 'PENDING',
  attempts smallint not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notification_dispatch_queue_due
  on public.notification_dispatch_queue (status, send_after, next_attempt_at);
create index idx_notification_dispatch_queue_user
  on public.notification_dispatch_queue (user_id, created_at desc);

create trigger trg_notification_dispatch_queue_updated_at
before update on public.notification_dispatch_queue
for each row execute function public.set_updated_at();

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dispatch_id uuid references public.notification_dispatch_queue(id) on delete set null,
  notification_type public.notification_type not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_notification_logs_user_created_at
  on public.notification_logs (user_id, created_at desc);

-- Functions ------------------------------------------------------------------

-- Bootstraps a new auth user's rows.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;

  insert into public.castle_states (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_wallets (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_change_counters (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Recreates the rows the drop above removed for users who signed up before
-- this baseline; the signup trigger only covers new users.
create function public.backfill_user_rows()
returns void
language sql
set search_path = ''
as $$
  insert into public.profiles (id, email, name)
  select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'name', '')
  from auth.users u
  on conflict (id) do nothing;

  insert into public.castle_states (user_id)
  select u.id from auth.users u
  on conflict (user_id) do nothing;

  insert into public.user_wallets (user_id)
  select u.id from auth.users u
  on conflict (user_id) do nothing;

  insert into public.user_change_counters (user_id)
  select u.id from auth.users u
  on conflict (user_id) do nothing;
$$;

select public.backfill_user_rows();

-- Registers the device's push token for the caller. A token another user holds
-- moves to the caller, so a logout that never reached the server cannot leak
-- one user's pushes to the next user of the device.
create function public.register_push_token(p_token text, p_device_info text default null)
returns public.user_push_tokens
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token public.user_push_tokens;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_token is null or btrim(p_token) = '' then
    raise exception 'Push token is required' using errcode = '22023';
  end if;

  insert into public.user_push_tokens (user_id, token_string, device_info)
  values (v_user_id, p_token, p_device_info)
  on conflict (token_string) do update
  set user_id = excluded.user_id,
      device_info = excluded.device_info
  returning * into v_token;

  return v_token;
end;
$$;

-- Row Level Security ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.user_change_counters enable row level security;
alter table public.sync_applied_operations enable row level security;
alter table public.transactions enable row level security;
alter table public.budget_plans enable row level security;
alter table public.budget_plan_limits enable row level security;
alter table public.day_checkins enable row level security;
alter table public.castle_states enable row level security;
alter table public.user_wallets enable row level security;
alter table public.user_upgrades enable row level security;
alter table public.streak_repair_requests enable row level security;
alter table public.game_liquidation_events enable row level security;
alter table public.user_push_tokens enable row level security;
alter table public.notification_dispatch_queue enable row level security;
alter table public.notification_logs enable row level security;

create policy profiles_select_owner on public.profiles
for select to authenticated using ((select auth.uid()) = id);

create policy profiles_update_owner on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy categories_select_authenticated on public.categories
for select to authenticated using (true);

create policy user_change_counters_select_owner on public.user_change_counters
for select to authenticated using ((select auth.uid()) = user_id);

create policy sync_applied_operations_select_owner on public.sync_applied_operations
for select to authenticated using ((select auth.uid()) = user_id);

create policy transactions_select_owner on public.transactions
for select to authenticated using ((select auth.uid()) = user_id);

create policy budget_plans_select_owner on public.budget_plans
for select to authenticated using ((select auth.uid()) = user_id);

create policy budget_plan_limits_select_owner on public.budget_plan_limits
for select to authenticated using ((select auth.uid()) = user_id);

create policy day_checkins_select_owner on public.day_checkins
for select to authenticated using ((select auth.uid()) = user_id);

create policy castle_states_select_owner on public.castle_states
for select to authenticated using ((select auth.uid()) = user_id);

create policy user_wallets_select_owner on public.user_wallets
for select to authenticated using ((select auth.uid()) = user_id);

create policy streak_repair_requests_select_owner on public.streak_repair_requests
for select to authenticated using ((select auth.uid()) = user_id);

create policy user_upgrades_select_owner on public.user_upgrades
for select to authenticated using ((select auth.uid()) = user_id);

create policy game_liquidation_events_select_owner on public.game_liquidation_events
for select to authenticated using ((select auth.uid()) = user_id);

create policy user_push_tokens_owner_all on public.user_push_tokens
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy notification_dispatch_queue_select_owner on public.notification_dispatch_queue
for select to authenticated using ((select auth.uid()) = user_id);

create policy notification_logs_select_owner on public.notification_logs
for select to authenticated using ((select auth.uid()) = user_id);

-- Grants ---------------------------------------------------------------------

-- Supabase's default privileges grant everything in public to anon and
-- authenticated; start from nothing and grant what v1 needs. Synced tables are
-- select-only: writes go through the sync RPC (security definer), which
-- assigns version and change_seq. Game state is written by the server only.
revoke all on all tables in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- Keep objects created by later migrations closed until granted explicitly.
-- EXECUTE for PUBLIC is a global default, so it is revoked without a schema.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;
alter default privileges for role postgres
  revoke execute on functions from public;

grant select on
  public.categories,
  public.user_change_counters,
  public.sync_applied_operations,
  public.transactions,
  public.budget_plans,
  public.budget_plan_limits,
  public.day_checkins,
  public.castle_states,
  public.user_wallets,
  public.user_upgrades,
  public.streak_repair_requests,
  public.game_liquidation_events,
  public.notification_dispatch_queue,
  public.notification_logs
to authenticated;

-- Profile edits are online-only.
grant select on public.profiles to authenticated;
grant update (name, currency, timezone) on public.profiles to authenticated;

grant select, insert, update, delete on public.user_push_tokens to authenticated;

grant execute on function public.register_push_token(text, text) to authenticated;

commit;
