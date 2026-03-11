# Phase 2 Closure Plan

Date: 2026-03-11  
Project: `zxdnuxqrogxlsumlzdlv`

## Objective

Close remaining Phase 2 gaps by finalizing automatic daily scheduler execution
and validating the end-to-end liquidation -> queue -> push flow.

## Current Confirmed State

- migrations `202603110001` to `202603110010` are applied (local and remote aligned)
- `expo-push-dispatcher` is deployed and active
- `pg_cron` schema is not available in this project

## Work Plan

1. Enable scheduler path
- Choose one:
  - Supabase Scheduled Edge Function
  - External scheduler calling `run_daily_liquidation_batch(...)`
- Define fixed execution hour in UTC.
- If using this repository setup, enable:
  - `.github/workflows/daily-liquidation-scheduler.yml`
  - Required secret: `SUPABASE_SERVICE_ROLE_KEY`

2. Validate baseline manually
- Trigger one controlled execution.
- Confirm a valid batch summary is returned.

3. Validate automatic execution
- Wait/trigger scheduled run.
- Confirm batch ran without critical SQL/function errors.

4. Validate post-run integrity
- Confirm idempotency and dedupe behavior.
- Confirm queue transitions and push log outcomes.

5. Run full smoke test
- Execute `docs/phase2-smoke-test-runbook.md` blocks A-F.
- Record PASS/FAIL and evidence.

6. Close documentation status
- Update pending checkboxes in `docs/supabase-migration-backlog.md` (H13/H14).
- Update status wording in `docs/phase2-rollout-checklist.md`.

## Verification Queries

1. Latest liquidation events:

```sql
select period_date, period_key, user_id, processed_at
from public.game_liquidation_events
order by processed_at desc
limit 30;
```

2. Duplicate check by period:

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

4. Dedupe key collisions:

```sql
select dedupe_key, count(*) as total
from public.notification_dispatch_queue
group by dedupe_key
having count(*) > 1;
```

5. Notification outcomes (last 24h):

```sql
select status, count(*) as total
from public.notification_logs
where created_at >= now() - interval '24 hours'
group by status
order by status;
```

## Done Criteria

Phase 2 is considered closed when:

- scheduler runs automatically once per day
- two consecutive daily executions complete without critical failures
- no duplicates for `user_id + period_key`
- queue and notification logs show expected delivery behavior
- smoke test blocks A-F are PASS with evidence
- documentation pending items are closed
