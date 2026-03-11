# Phase 2 Operations Runbook

## Objective

Operate daily liquidation and automatic push dispatch safely, with clear visibility
and fast recovery procedures.

## Runtime Components

- SQL RPC: `process_daily_liquidation(...)`
- SQL batch: `run_daily_liquidation_batch(...)`
- SQL trigger: `trg_enqueue_liquidation_notification`
- Queue table: `notification_dispatch_queue`
- Edge Function: `expo-push-dispatcher`
- Scheduler:
  - preferred: `pg_cron` job `daily-liquidation-batch` (if extension exists)
  - fallback: scheduled Edge Function or external scheduler invoking `run_daily_liquidation_batch(...)`

## Monitoring Checklist

Run at least once per day:

1. Liquidation events created:

```sql
select period_date, count(*) as events
from public.game_liquidation_events
where period_date >= current_date - 2
group by period_date
order by period_date desc;
```

2. Queue health:

```sql
select status, count(*) as jobs
from public.notification_dispatch_queue
group by status
order by status;
```

3. Retry pressure:

```sql
select
  count(*) filter (where attempts >= 3) as high_retry_jobs,
  max(attempts) as max_attempts
from public.notification_dispatch_queue
where status in ('PENDING', 'FAILED');
```

4. Notification delivery outcomes:

```sql
select status, count(*) as total
from public.notification_logs
where created_at >= now() - interval '24 hours'
group by status
order by status;
```

## Alerts (Suggested)

- `FAILED` queue jobs > 0 for more than 15 minutes.
- No new `game_liquidation_events` for current period after scheduler window.
- Dispatcher success ratio below 95% in 1 hour.

## Incident Playbook

### A. Scheduler did not run

1. Check scheduler backend:
   - if `pg_cron` is enabled, inspect `cron.job` for `daily-liquidation-batch`
   - otherwise inspect external/scheduled function runner logs
2. Trigger manual batch:

```sql
select public.run_daily_liquidation_batch();
```

3. Validate new rows in `game_liquidation_events`.

### B. Queue growing / pushes not sent

1. Check dispatcher function logs.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `EXPO_ACCESS_TOKEN`.
3. Manually invoke dispatcher in small batch.
4. If needed, temporarily pause new enqueue trigger and process backlog.

### C. Unexpected duplicate notifications

1. Validate `dedupe_key` uniqueness:

```sql
select dedupe_key, count(*)
from public.notification_dispatch_queue
group by dedupe_key
having count(*) > 1;
```

2. Confirm trigger logic uses deterministic key format.
3. Backfill cleanup only after root cause is fixed.

## Recovery and Replay

Use replay only after identifying root cause:

1. Requeue failed jobs:

```sql
update public.notification_dispatch_queue
set
  status = 'PENDING',
  next_retry_at = null,
  last_error = null,
  updated_at = now()
where status = 'FAILED';
```

2. Re-run dispatcher with controlled batch size.
3. Monitor for repeated failures before widening batch.

## Change Management

- Any rule update must bump `rules_version`.
- Never mutate historical rows in `game_liquidation_events`.
- Deploy SQL migrations before enabling related scheduler/function changes.
