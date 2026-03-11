-- H14 phase-2: enqueue push notification jobs from liquidation events.

begin;

create or replace function public.enqueue_liquidation_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type public.notification_type;
  v_title text;
  v_body text;
  v_gold_delta integer;
  v_hp_delta integer;
  v_dedupe_key text;
begin
  v_gold_delta := new.gold_after - new.gold_before;
  v_hp_delta := new.hp_after - new.hp_before;
  v_dedupe_key := 'liquidation:' || new.user_id::text || ':' || new.period_key;

  if new.hp_after = 0 then
    v_type := 'ATTACK';
    v_title := 'Your fortress is in ruins';
    v_body := 'Your HP reached 0 during daily liquidation. Recover to protect your streak.';
  elsif v_hp_delta < 0 then
    v_type := 'ATTACK';
    v_title := 'Your fortress took damage';
    v_body := 'Daily liquidation applied damage. Check your balance and activity streak.';
  else
    v_type := 'REWARD';
    v_title := 'Daily reward applied';
    v_body := 'You gained ' || greatest(v_gold_delta, 0)::text || ' gold from your streak.';
  end if;

  insert into public.notification_dispatch_queue (
    user_id,
    event_id,
    notification_type,
    title,
    body,
    payload,
    dedupe_key,
    status,
    attempts
  )
  values (
    new.user_id,
    new.id,
    v_type,
    v_title,
    v_body,
    jsonb_build_object(
      'eventId', new.id,
      'periodKey', new.period_key,
      'goldDelta', v_gold_delta,
      'hpDelta', v_hp_delta,
      'rulesVersion', new.rules_version
    ),
    v_dedupe_key,
    'PENDING',
    0
  )
  on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_enqueue_liquidation_notification on public.game_liquidation_events;
create trigger trg_enqueue_liquidation_notification
after insert on public.game_liquidation_events
for each row execute function public.enqueue_liquidation_notification();

commit;
