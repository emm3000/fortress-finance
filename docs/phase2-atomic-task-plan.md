# Phase 2 Atomic Task Plan

## Goal

Execute Phase 2 progressively with atomic, reviewable changes.
One task should map to one commit whenever possible.

## Scope

- H13: Daily liquidation and game engine automation.
- H14: Automatic push notification pipeline.

## Atomic Tasks

### task-01: Define Daily Liquidation Contract

- Deliverable: spec document with exact rules (HP, gold, streak, caps, timezone, idempotency).
- Suggested commit: `docs(phase2): define daily liquidation contract`

### task-02: Add Game Event Schema

- Deliverable: SQL migration for liquidation events table, indexes, and unique dedupe key per period.
- Suggested commit: `feat(db): add game liquidation events table`

### task-03: Implement Idempotent Daily Liquidation RPC

- Deliverable: transactional SQL RPC updating `castle_states`, `user_wallets`, and event rows atomically.
- Suggested commit: `feat(db): add daily liquidation rpc`

### task-04: Validate Core SQL Rules

- Deliverable: SQL validation scripts/checklist for idempotency, ownership, and consistency.
- Suggested commit: `test(db): validate liquidation idempotency`

### task-05: Add Daily Scheduler

- Deliverable: scheduled job that executes liquidation in batches and records outcomes.
- Suggested commit: `feat(ops): add daily liquidation scheduler`

### task-06: Add Notification Dispatch Queue

- Deliverable: SQL migration for notification dispatch table (`pending/sent/failed`) plus dedupe key.
- Suggested commit: `feat(db): add notification dispatch queue`

### task-07: Implement Expo Push Dispatcher (Edge Function)

- Deliverable: Edge Function that reads pending jobs, sends Expo pushes, and writes results to `notification_logs`.
- Suggested commit: `feat(functions): add expo push dispatcher`

### task-08: Add Retry and Backoff Policy

- Deliverable: retry policy with exponential backoff and terminal-failure handling.
- Suggested commit: `feat(notifications): add retry and backoff policy`

### task-09: Integrate Liquidation -> Notification

- Deliverable: enqueue deduplicated notifications when liquidation events are created.
- Suggested commit: `feat(notifications): enqueue push on liquidation events`

### task-10: Add Observability and Ops Runbook

- Deliverable: metrics/logging checklist and operational runbook (incident handling and replay).
- Suggested commit: `docs(phase2): add operations runbook and monitoring`

### task-11: Run Phase 2 Smoke Tests

- Deliverable: end-to-end validation results (daily run, no duplicates, correct push behavior, home consistency).
- Suggested commit: `test(phase2): add smoke validation results`

### task-12: Close Phase 2 Backlog

- Deliverable: update backlog/checklists to reflect completed deferred items.
- Suggested commit: `docs(phase2): close deferred migration items`

## Dependency Order

1. `task-01`
2. `task-02`
3. `task-03`
4. `task-04`
5. `task-05`
6. `task-06`
7. `task-07`
8. `task-08`
9. `task-09`
10. `task-10`
11. `task-11`
12. `task-12`

## Completion Criteria for Phase 2

- Daily liquidation runs automatically and is idempotent.
- Push delivery is automated and deduplicated.
- `notification_logs` reflects real delivery outcomes.
- Home state remains consistent after daily runs.
- Operations runbook is complete and validated.
