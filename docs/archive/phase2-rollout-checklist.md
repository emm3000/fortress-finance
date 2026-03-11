# Phase 2 Remote Rollout Checklist

## Current Status

Date: 2026-03-11  
Target project: `zxdnuxqrogxlsumlzdlv`  
Status: Rollout completed (external scheduler active, delivery validated)

## Platform Note (as of 2026-03-11)

- `pg_cron` extension is not installed in this project.
- SQL scheduler job (`cron.job`) is therefore unavailable.
- Daily automation uses external scheduler path.

Selected implementation in this repo:
- External scheduler via GitHub Actions:
  - `.github/workflows/daily-liquidation-scheduler.yml`

## Closure Criteria

Phase 2 can be marked fully closed only when all are true:

- scheduler runs automatically every day (without manual trigger)
- two consecutive daily runs complete without critical errors
- no duplicate liquidation effects for same `user_id + period_key`
- queue flow `PENDING -> SENT` is verified after automated run
- `docs/supabase-migration-backlog.md` H13/H14 pending items are updated to closed
- `docs/phase2-smoke-test-runbook.md` blocks A-F are PASS with evidence

## 1) Ensure Project Is Active

- Open Supabase dashboard for project `zxdnuxqrogxlsumlzdlv`.
- Resume/reactivate project services.
- Confirm database and Edge Functions services are available.

## 2) Apply Phase 2 Migrations (in order)

1. `supabase/migrations/202603110006_h13_game_liquidation_events.sql`
2. `supabase/migrations/202603110007_h13_daily_liquidation_rpc.sql`
3. `supabase/migrations/202603110008_h13_daily_liquidation_scheduler.sql`
4. `supabase/migrations/202603110009_h14_notification_dispatch_queue.sql`
5. `supabase/migrations/202603110010_h14_liquidation_notification_enqueue.sql`

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
  - daily scheduler strategy finalized (without `pg_cron` unless extension is enabled)

## Post-Closure Monitoring (Execution Order)

1. Keep daily scheduler workflow enabled in GitHub Actions.
2. Monitor first scheduled window after manual validation.
3. Validate idempotency and dedupe after scheduled run.
4. Run full Phase 2 smoke runbook and keep evidence updated.

## Scheduler Secrets (GitHub Actions)

- `SUPABASE_SERVICE_ROLE_KEY`

## Execution Notes (2026-03-11)

- Migrations applied with Supabase CLI `db push`.
- Edge Function `expo-push-dispatcher` deployed.
- Android device token registered successfully.
- Manual and queue-based push notifications reached device.
- GitHub Actions workflow `daily-liquidation-scheduler` executed successfully.
- Workflow result:
  - liquidation RPC: `failed=0`
  - dispatcher: `sent=1`, `failed=0`
