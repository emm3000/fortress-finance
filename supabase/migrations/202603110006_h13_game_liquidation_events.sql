-- H13 phase-2 foundation: daily liquidation event ledger.
-- Provides idempotency key and immutable audit trail for per-user daily runs.

begin;

create table if not exists public.game_liquidation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_key text not null,
  period_date date not null,
  period_tz text not null default 'UTC',
  hp_before integer not null,
  hp_after integer not null,
  gold_before integer not null,
  gold_after integer not null,
  streak_before integer not null,
  streak_after integer not null,
  rules_version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, period_key),
  check (char_length(trim(period_key)) > 0),
  check (char_length(trim(period_tz)) > 0),
  check (hp_before >= 0),
  check (hp_after >= 0),
  check (gold_before >= 0),
  check (gold_after >= 0),
  check (streak_before >= 0),
  check (streak_after >= 0),
  check (rules_version > 0)
);

create index if not exists idx_game_liquidation_events_user_processed_at
  on public.game_liquidation_events (user_id, processed_at desc);

create index if not exists idx_game_liquidation_events_period_date
  on public.game_liquidation_events (period_date desc);

create index if not exists idx_game_liquidation_events_rules_version
  on public.game_liquidation_events (rules_version);

alter table public.game_liquidation_events enable row level security;

grant select on public.game_liquidation_events to authenticated;

drop policy if exists game_liquidation_events_select_owner on public.game_liquidation_events;
create policy game_liquidation_events_select_owner
on public.game_liquidation_events
for select
to authenticated
using (auth.uid() = user_id);

commit;
