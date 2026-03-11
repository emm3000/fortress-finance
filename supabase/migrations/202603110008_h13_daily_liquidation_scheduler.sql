-- H13 phase-2: batch liquidation executor + optional daily scheduler.

begin;

create or replace function public.run_daily_liquidation_batch(
  p_period_date date default null,
  p_period_tz text default 'UTC',
  p_rules_version integer default 1,
  p_max_users integer default 5000
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate record;
  v_processed integer := 0;
  v_idempotent integer := 0;
  v_failed integer := 0;
  v_max_users integer := greatest(coalesce(p_max_users, 0), 0);
  v_result jsonb;
begin
  if p_rules_version <= 0 then
    raise exception 'rules_version must be greater than zero';
  end if;

  for v_candidate in
    select cs.user_id
    from public.castle_states cs
    inner join public.user_wallets uw on uw.user_id = cs.user_id
    order by cs.user_id
    limit v_max_users
  loop
    begin
      v_result := public.process_daily_liquidation(
        p_user_id => v_candidate.user_id,
        p_period_date => p_period_date,
        p_period_tz => p_period_tz,
        p_rules_version => p_rules_version
      );

      if coalesce((v_result ->> 'idempotent')::boolean, false) then
        v_idempotent := v_idempotent + 1;
      else
        v_processed := v_processed + 1;
      end if;
    exception
      when others then
        v_failed := v_failed + 1;
    end;
  end loop;

  return jsonb_build_object(
    'processed', v_processed,
    'idempotent', v_idempotent,
    'failed', v_failed,
    'maxUsers', v_max_users,
    'periodDate', coalesce(p_period_date, current_date),
    'periodTz', coalesce(nullif(trim(p_period_tz), ''), 'UTC'),
    'rulesVersion', p_rules_version
  );
end;
$$;

revoke all on function public.run_daily_liquidation_batch(date, text, integer, integer) from public;
grant execute on function public.run_daily_liquidation_batch(date, text, integer, integer) to service_role;

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

    perform cron.schedule(
      'daily-liquidation-batch',
      '0 5 * * *',
      $job$select public.run_daily_liquidation_batch();$job$
    );
  end if;
end;
$$;

commit;
