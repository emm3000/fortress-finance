# Phase 2 Daily Liquidation Contract

## Purpose

Define deterministic and idempotent rules for daily game liquidation so the system
can run automatically without duplicating effects.

## Execution Window

- Liquidation is processed once per user per local day.
- The scheduler runs in UTC batches and computes each user's local day.
- The dedupe unit is `user_id + period_key`.

## Period Identity

- `period_key` format: `YYYY-MM-DD@<tz>`
- Example: `2026-03-11@America/Lima`
- `period_date` stores the date portion (`YYYY-MM-DD`).

## Inputs

- Current `castle_states` row for user.
- Current `user_wallets` row for user.
- User timezone (default to `UTC` when unavailable).

## Outputs

- Updated `castle_states` (HP/status).
- Updated `user_wallets` (gold/streak).
- One immutable event row in `game_liquidation_events`.

## Core Rules (v1 of Phase 2)

1. Idempotency
- If an event exists for `user_id + period_key`, no state mutation is applied.
- The existing event is returned as canonical result.

2. HP evolution
- HP is clamped between `0` and `max_hp`.
- If user has positive streak, apply small heal (bounded by max HP).
- If user has no streak, apply small damage (bounded by 0).

3. Status transition
- `HEALTHY` when HP ratio >= 0.5
- `UNDER_ATTACK` when 0 < HP ratio < 0.5
- `RUINS` when HP = 0

4. Gold and streak
- Positive streak grants daily gold reward.
- Zero streak grants no reward.
- Streak never goes below `0`.

5. Atomicity
- State updates and event insert are a single transaction.
- Either all changes commit or none commit.

## Event Payload Contract

`game_liquidation_events` stores:

- identity: `id`, `user_id`, `period_key`, `period_date`, `period_tz`
- before/after snapshots:
  - `hp_before`, `hp_after`
  - `gold_before`, `gold_after`
  - `streak_before`, `streak_after`
- `rules_version` for future compatibility
- `metadata` JSON for non-critical details
- `processed_at`, `created_at`

## Error Handling

- Missing user state rows are treated as bootstrap/data integrity issue.
- The operation must fail fast and avoid partial writes.
- Scheduler should retry transient failures and keep permanent failures logged.

## Observability Requirements

- Count processed users, skipped idempotent users, and failed users.
- Emit per-batch duration and max latency.
- Persist per-user event record for audit and replayability.

## Compatibility and Evolution

- Rule changes must increment `rules_version`.
- Historical events remain immutable.
- Recompute/replay should always be explicit and never implicit.
