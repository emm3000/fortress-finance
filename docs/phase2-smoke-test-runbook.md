# Phase 2 Smoke Test Runbook (35-50 min)

## Goal

Validate daily liquidation automation and push dispatch behavior end-to-end.

## Preconditions

- Latest Phase 2 migrations are applied.
- Automatic scheduler strategy is active (`Scheduled Edge Function` or external scheduler).
- Manual fallback execution is available for incident recovery (`run_daily_liquidation_batch(...)`).
- `expo-push-dispatcher` Edge Function is deployed.
- Test user has:
  - `castle_states` row
  - `user_wallets` row
  - at least one `user_push_tokens` row

## Evidence Required

For each block:

- 1 screenshot or SQL result proving final state
- PASS/FAIL result
- exact error text if FAIL

## Block A: Idempotent Liquidation

1. Run liquidation for test user/date twice.
2. Confirm only one event exists for `user_id + period_key`.
3. Confirm second run returns `idempotent = true`.

PASS criteria:

- single event row for same period
- no double mutation in castle/wallet

## Block B: Queue Enqueue Trigger

1. Insert a new liquidation event via RPC.
2. Verify one queue row appears in `notification_dispatch_queue`.
3. Verify `dedupe_key` shape: `liquidation:<user_id>:<period_key>`.

PASS criteria:

- queue row created automatically
- no duplicate queue rows for same dedupe key

## Block C: Dispatcher Success Path

1. Invoke Edge Function dispatcher (`batch=10`).
2. Confirm queue row transitions to `SENT`.
3. Confirm `notification_logs` row with `status='SENT'`.

PASS criteria:

- sent count > 0
- queue status updated to `SENT`

## Block D: Retry/Backoff Path

1. Force a dispatch failure (invalid token or temporarily disable Expo token).
2. Invoke dispatcher.
3. Confirm:
   - attempts incremented
   - status becomes `PENDING` with `next_retry_at`
4. Repeat until terminal threshold.
5. Confirm terminal state `FAILED` and failed log entry.

PASS criteria:

- exponential backoff populated
- terminal failure handling works at max attempts

## Block E: Scheduler Path

1. Trigger scheduler manually or wait for cron window.
2. Confirm batch summary output from `run_daily_liquidation_batch`.
3. Confirm event creation and queue enqueue for processed users.

PASS criteria:

- non-zero processed/idempotent count
- no unhandled SQL errors

## Block F: Home/UX Consistency

1. Open app home after liquidation.
2. Verify castle and wallet values are coherent.
3. Open alerts and verify entry consistency with generated notifications.

PASS criteria:

- no broken UI state
- values match DB after liquidation

## Exit Criteria

Phase 2 smoke is considered valid when:

- all blocks A-F are PASS
- evidence is recorded for each block
- no unresolved critical errors remain

## Suggested SQL Helpers

```sql
select * from public.game_liquidation_events order by processed_at desc limit 20;
select * from public.notification_dispatch_queue order by created_at desc limit 20;
select * from public.notification_logs order by created_at desc limit 20;
```
