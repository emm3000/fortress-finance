# Operations Guide

## 1) Environment Contract

Mobile runtime (required):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Mobile runtime (optional):

- `EXPO_PUBLIC_SENTRY_DSN`

App environment labels:

- `APP_ENV`
- `EXPO_PUBLIC_APP_ENV`

Server-side only (do not expose in mobile client):

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `EXPO_ACCESS_TOKEN` (recommended for Expo push service)

## 2) Scheduler and Notification Flow

Current production strategy (without `pg_cron`):

- GitHub Actions scheduler:
  - `.github/workflows/daily-liquidation-scheduler.yml`
- Step A: invoke `run_daily_liquidation_batch` RPC.
- Step B: invoke `expo-push-dispatcher` Edge Function.

Required GitHub secret:

- `SUPABASE_SERVICE_ROLE_KEY`

Required Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended Edge Function secret:

- `EXPO_ACCESS_TOKEN`

## 3) Core Validation Queries

1. Recent liquidation events:

```sql
select period_date, period_key, user_id, processed_at
from public.game_liquidation_events
order by processed_at desc
limit 30;
```

2. Idempotency duplicate check:

```sql
select user_id, period_key, count(*) as rows_per_period
from public.game_liquidation_events
group by user_id, period_key
having count(*) > 1;
```

3. Queue health:

```sql
select status, count(*) as total
from public.notification_dispatch_queue
group by status
order by status;
```

4. Push outcomes in last 24h:

```sql
select status, count(*) as total
from public.notification_logs
where created_at >= now() - interval '24 hours'
group by status
order by status;
```

## 4) Incident Triage

If scheduler job fails:

1. Check GitHub Actions run logs for failing step.
2. Re-run workflow manually (`workflow_dispatch`) with defaults.
3. Verify Edge Function deployment and secrets.
4. Confirm database writes with validation queries.

If dispatcher returns 401:

1. Verify function deployed with JWT verification disabled for this internal endpoint.
2. Confirm scheduler request sends both headers:
   - `apikey: <SUPABASE_SERVICE_ROLE_KEY>`
   - `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
3. Re-run workflow and check `sent/failed` counters.

## 5) Release Safety Checks

Before declaring stable operation:

1. Two consecutive daily scheduler runs complete without critical failures.
2. `rows_per_period > 1` query returns no rows.
3. Dispatcher reports successful sends and no persistent failure growth.

## 6) v1 Baseline Cutover (one time)

`supabase/migrations/202603110012_v1_baseline.sql` replaces the 11 earlier migrations (ADR 0005 clean cut). The owner applies it to the hosted project once, after the PR merges:

1. Link the project: `supabase link --project-ref <ref>`.
2. Mark the deleted versions as reverted so the CLI stops expecting their files:
   `supabase migration repair --linked --status reverted 202603110001 202603110002 202603110003 202603110004 202603110005 202603110006 202603110007 202603110008 202603110009 202603110010 202603110011`
3. Check that only the baseline is pending: `supabase migration list --linked`.
4. Apply it: `supabase db push --linked`.

The baseline drops every table, view, function and type in `public`, so all public data is wiped (transactions, budgets, wallets, ledger, push tokens, notifications). `auth.users` is kept: the migration backfills each existing user's profile, castle state, wallet and change counter. It also unschedules the `pg_cron` job `daily-liquidation-batch` when `pg_cron` is installed. Clients built before v1 fail against the new schema until they are replaced (ADR 0007).
