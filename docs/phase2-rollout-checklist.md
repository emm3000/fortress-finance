# Phase 2 Remote Rollout Checklist

## Current Blocker

Date: 2026-03-11  
Project: `sytwkomczzkygekjhpnm`  
Observed status: `INACTIVE`

Deployment error observed:

```text
Cannot retrieve service for project sytwkomczzkygekjhpnm with current status 'INACTIVE'.
```

## 1) Reactivate Supabase Project

- Open Supabase dashboard for project `sytwkomczzkygekjhpnm`.
- Resume/reactivate project services.
- Confirm database and Edge Functions services are available.

## 2) Apply Phase 2 Migrations (in order)

1. `supabase/migrations/20260311_h13_game_liquidation_events.sql`
2. `supabase/migrations/20260311_h13_daily_liquidation_rpc.sql`
3. `supabase/migrations/20260311_h13_daily_liquidation_scheduler.sql`
4. `supabase/migrations/20260311_h14_notification_dispatch_queue.sql`
5. `supabase/migrations/20260311_h14_liquidation_notification_enqueue.sql`

After applying:

```sql
NOTIFY pgrst, 'reload schema';
```

## 3) Deploy Edge Function

- Function name: `expo-push-dispatcher`
- Entrypoint: `supabase/functions/expo-push-dispatcher/index.ts`
- Required secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `EXPO_ACCESS_TOKEN` (optional but recommended)

## 4) Verify Database Objects

```sql
select to_regclass('public.game_liquidation_events') as game_events_table;
select to_regclass('public.notification_dispatch_queue') as dispatch_queue_table;

select proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('process_daily_liquidation', 'run_daily_liquidation_batch')
order by proname;
```

## 5) Execute Validation Script

- Run: `supabase/validation/phase2-liquidation-idempotency.sql`
- Confirm:
  - one event per `user_id + period_key`
  - second liquidation run is idempotent
  - state bounds are preserved

## 6) Run Phase 2 Smoke Tests

- Follow: `docs/phase2-smoke-test-runbook.md`
- Record evidence (PASS/FAIL per block).

## 7) Close Phase 2 Backlog

- Update `docs/supabase-migration-backlog.md` deferred items (H13/H14) only after:
  - migrations applied
  - dispatcher deployed
  - smoke tests passed
