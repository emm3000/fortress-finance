-- H2 baseline for Supabase migration (no production data yet).
-- This script resets public schema objects and recreates the v1 data model.

begin;

-- Drop all existing tables in public.
do $$
declare
  rec record;
begin
  for rec in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', rec.tablename);
  end loop;
end $$;

-- Drop all existing enum types in public.
do $$
declare
  rec record;
begin
  for rec in
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typtype = 'e'
  loop
    execute format('drop type if exists public.%I cascade', rec.typname);
  end loop;
end $$;

create type public.transaction_type as enum ('INCOME', 'EXPENSE');
create type public.castle_status as enum ('HEALTHY', 'UNDER_ATTACK', 'RUINS');
create type public.budget_period as enum ('MONTHLY');
create type public.notification_type as enum ('ATTACK', 'REWARD', 'SHOP');
create type public.notification_status as enum ('SENT', 'FAILED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.transaction_type not null,
  icon text not null default '',
  color text,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, type)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  type public.transaction_type not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.castle_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level integer not null default 1,
  hp integer not null default 100,
  max_hp integer not null default 100,
  status public.castle_status not null default 'HEALTHY',
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  limit_amount numeric(10,2) not null,
  period public.budget_period not null default 'MONTHLY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create table public.user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold_balance integer not null default 0,
  streak_days integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_string text not null unique,
  device_info text,
  created_at timestamptz not null default now()
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type public.notification_type not null,
  status public.notification_status not null default 'SENT',
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency char(3) not null,
  monthly_income_goal numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_initial_categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

-- Sync and dashboard performance indexes.
create index idx_transactions_user_updated_at on public.transactions (user_id, updated_at);
create index idx_transactions_user_category_type_date on public.transactions (user_id, category_id, type, date);
create index idx_transactions_user_deleted_date on public.transactions (user_id, deleted_at, date desc);
create index idx_budgets_user_updated_at on public.budgets (user_id, updated_at);
create index idx_user_push_tokens_user_id on public.user_push_tokens (user_id);
create index idx_notification_logs_user_created_at on public.notification_logs (user_id, created_at desc);
create index idx_user_initial_categories_user_id on public.user_initial_categories (user_id);

-- Generic updated_at trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger trg_castle_states_updated_at
before update on public.castle_states
for each row execute function public.set_updated_at();

create trigger trg_budgets_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger trg_user_wallets_updated_at
before update on public.user_wallets
for each row execute function public.set_updated_at();

create trigger trg_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

-- Idempotent default categories seed.
insert into public.categories (name, type, icon, color, is_default)
values
  ('Salary', 'INCOME', 'briefcase', '#16a34a', true),
  ('Freelance', 'INCOME', 'laptop', '#22c55e', true),
  ('Food', 'EXPENSE', 'utensils', '#ef4444', true),
  ('Transport', 'EXPENSE', 'car', '#f97316', true),
  ('Housing', 'EXPENSE', 'home', '#eab308', true),
  ('Health', 'EXPENSE', 'heart-pulse', '#06b6d4', true),
  ('Education', 'EXPENSE', 'book-open', '#8b5cf6', true),
  ('Entertainment', 'EXPENSE', 'film', '#ec4899', true)
on conflict (name, type) do update set
  icon = excluded.icon,
  color = excluded.color,
  is_default = excluded.is_default,
  updated_at = now();

commit;
