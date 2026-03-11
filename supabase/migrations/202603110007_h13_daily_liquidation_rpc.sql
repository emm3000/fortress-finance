-- H13 phase-2: idempotent daily liquidation RPC.
-- Applies daily castle/wallet mutation once per user and period key.

begin;

create or replace function public.process_daily_liquidation(
  p_user_id uuid default null,
  p_period_date date default null,
  p_period_tz text default 'UTC',
  p_rules_version integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid;
  v_target_user_id uuid;
  v_period_date date;
  v_period_tz text;
  v_period_key text;
  v_now timestamptz;
  v_event public.game_liquidation_events%rowtype;
  v_castle public.castle_states%rowtype;
  v_wallet public.user_wallets%rowtype;
  v_hp_after integer;
  v_gold_after integer;
  v_streak_after integer;
  v_status public.castle_status;
  v_damage integer := 5;
  v_heal integer := 5;
  v_gold_reward integer := 10;
begin
  v_actor_user_id := auth.uid();
  v_now := timezone('UTC', now());

  if p_rules_version <= 0 then
    raise exception 'rules_version must be greater than zero';
  end if;

  v_period_tz := nullif(trim(coalesce(p_period_tz, 'UTC')), '');
  if v_period_tz is null then
    v_period_tz := 'UTC';
  end if;

  v_period_date := coalesce(p_period_date, (v_now at time zone v_period_tz)::date);
  v_period_key := to_char(v_period_date, 'YYYY-MM-DD') || '@' || v_period_tz;

  if v_actor_user_id is null then
    if p_user_id is null then
      raise exception 'p_user_id is required when auth.uid() is null';
    end if;
    v_target_user_id := p_user_id;
  else
    v_target_user_id := coalesce(p_user_id, v_actor_user_id);
    if v_target_user_id <> v_actor_user_id then
      raise exception 'Not authorized to process liquidation for another user';
    end if;
  end if;

  select *
  into v_castle
  from public.castle_states cs
  where cs.user_id = v_target_user_id
  for update;

  if not found then
    raise exception 'Missing castle state for user %', v_target_user_id;
  end if;

  select *
  into v_wallet
  from public.user_wallets uw
  where uw.user_id = v_target_user_id
  for update;

  if not found then
    raise exception 'Missing wallet state for user %', v_target_user_id;
  end if;

  -- Idempotency check after per-user row locks to avoid concurrent double mutation.
  select *
  into v_event
  from public.game_liquidation_events gle
  where gle.user_id = v_target_user_id
    and gle.period_key = v_period_key;

  if found then
    return jsonb_build_object(
      'idempotent', true,
      'eventId', v_event.id,
      'userId', v_event.user_id,
      'periodKey', v_event.period_key,
      'periodDate', v_event.period_date,
      'periodTz', v_event.period_tz,
      'rulesVersion', v_event.rules_version,
      'changes', jsonb_build_object(
        'hpBefore', v_event.hp_before,
        'hpAfter', v_event.hp_after,
        'goldBefore', v_event.gold_before,
        'goldAfter', v_event.gold_after,
        'streakBefore', v_event.streak_before,
        'streakAfter', v_event.streak_after
      )
    );
  end if;

  if greatest(v_wallet.streak_days, 0) > 0 then
    v_hp_after := least(v_castle.max_hp, v_castle.hp + v_heal);
    v_gold_after := v_wallet.gold_balance + v_gold_reward;
    v_streak_after := greatest(v_wallet.streak_days, 0) + 1;
  else
    v_hp_after := greatest(0, v_castle.hp - v_damage);
    v_gold_after := v_wallet.gold_balance;
    v_streak_after := greatest(v_wallet.streak_days, 0);
  end if;

  if v_hp_after = 0 then
    v_status := 'RUINS';
  elsif v_castle.max_hp <= 0 then
    v_status := 'UNDER_ATTACK';
  elsif (v_hp_after::numeric / v_castle.max_hp::numeric) < 0.5 then
    v_status := 'UNDER_ATTACK';
  else
    v_status := 'HEALTHY';
  end if;

  update public.castle_states
  set
    hp = v_hp_after,
    status = v_status,
    updated_at = v_now
  where user_id = v_target_user_id;

  update public.user_wallets
  set
    gold_balance = v_gold_after,
    streak_days = v_streak_after,
    updated_at = v_now
  where user_id = v_target_user_id;

  insert into public.game_liquidation_events (
    user_id,
    period_key,
    period_date,
    period_tz,
    hp_before,
    hp_after,
    gold_before,
    gold_after,
    streak_before,
    streak_after,
    rules_version,
    metadata,
    processed_at
  )
  values (
    v_target_user_id,
    v_period_key,
    v_period_date,
    v_period_tz,
    v_castle.hp,
    v_hp_after,
    v_wallet.gold_balance,
    v_gold_after,
    v_wallet.streak_days,
    v_streak_after,
    p_rules_version,
    jsonb_build_object(
      'damage', v_damage,
      'heal', v_heal,
      'goldReward', v_gold_reward
    ),
    v_now
  )
  returning * into v_event;

  return jsonb_build_object(
    'idempotent', false,
    'eventId', v_event.id,
    'userId', v_event.user_id,
    'periodKey', v_event.period_key,
    'periodDate', v_event.period_date,
    'periodTz', v_event.period_tz,
    'rulesVersion', v_event.rules_version,
    'statusAfter', v_status,
    'changes', jsonb_build_object(
      'hpBefore', v_event.hp_before,
      'hpAfter', v_event.hp_after,
      'goldBefore', v_event.gold_before,
      'goldAfter', v_event.gold_after,
      'streakBefore', v_event.streak_before,
      'streakAfter', v_event.streak_after
    )
  );
end;
$$;

revoke all on function public.process_daily_liquidation(uuid, date, text, integer) from public;
grant execute on function public.process_daily_liquidation(uuid, date, text, integer) to authenticated;
grant execute on function public.process_daily_liquidation(uuid, date, text, integer) to service_role;

commit;
