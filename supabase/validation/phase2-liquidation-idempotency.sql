-- Phase 2 validation: daily liquidation idempotency and consistency checks.
-- Run manually in SQL Editor against a non-production environment first.

-- 0) Setup: replace with an existing authenticated user id.
-- select id from auth.users order by created_at desc limit 5;
-- \set test_user_id '00000000-0000-0000-0000-000000000000'

-- 1) Baseline state for the test user.
select
  cs.user_id,
  cs.hp,
  cs.max_hp,
  cs.status,
  uw.gold_balance,
  uw.streak_days
from public.castle_states cs
join public.user_wallets uw on uw.user_id = cs.user_id
where cs.user_id = :'test_user_id';

-- 2) Execute liquidation twice for same date/timezone.
select public.process_daily_liquidation(
  p_user_id => :'test_user_id',
  p_period_date => current_date,
  p_period_tz => 'UTC',
  p_rules_version => 1
) as first_run;

select public.process_daily_liquidation(
  p_user_id => :'test_user_id',
  p_period_date => current_date,
  p_period_tz => 'UTC',
  p_rules_version => 1
) as second_run;

-- 3) Assert dedupe key uniqueness by period.
select
  user_id,
  period_key,
  count(*) as event_count
from public.game_liquidation_events
where user_id = :'test_user_id'
  and period_key = to_char(current_date, 'YYYY-MM-DD') || '@UTC'
group by user_id, period_key;

-- Expected: event_count = 1

-- 4) Assert immutable snapshots are coherent.
select
  id,
  user_id,
  period_key,
  hp_before,
  hp_after,
  gold_before,
  gold_after,
  streak_before,
  streak_after,
  rules_version,
  processed_at
from public.game_liquidation_events
where user_id = :'test_user_id'
order by processed_at desc
limit 5;

-- 5) Verify current state remains bounded.
select
  cs.user_id,
  cs.hp,
  cs.max_hp,
  (cs.hp between 0 and cs.max_hp) as hp_in_bounds,
  uw.gold_balance,
  (uw.gold_balance >= 0) as gold_non_negative,
  uw.streak_days,
  (uw.streak_days >= 0) as streak_non_negative
from public.castle_states cs
join public.user_wallets uw on uw.user_id = cs.user_id
where cs.user_id = :'test_user_id';

-- 6) Optional cleanup for repeated manual tests.
-- delete from public.game_liquidation_events
-- where user_id = :'test_user_id'
--   and period_key = to_char(current_date, 'YYYY-MM-DD') || '@UTC';
