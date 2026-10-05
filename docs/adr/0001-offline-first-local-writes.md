# 0001 - Offline-first local writes for transactions

- Status: Superseded by 0005 (still describes the running code until phase 1 of `docs/prd/v1.md` ships)
- Date: 2026-10-05

## Context

Users log expenses where connectivity is poor. Losing or delaying a Transaction breaks the core loop, and the app must stay usable without network.

## Decision

- Transactions are written to SQLite first (`db/` repositories over expo-sqlite) and shown from there.
- Each write enqueues one `sync_operations` row per entity (UNIQUE `user_id, entity_type, entity_id`); later writes coalesce into it and the last payload wins.
- Ids are client UUID v4 and become the server primary key, so no id remapping happens after sync.
- `updatedAt` (ISO-8601 UTC) resolves conflicts by last-write-wins inside RPC `sync_client_state`.
- Deletes are soft (`deleted_at`) so they can sync like any update.
- Each operation carries a stable `operationId`; the server returns `acknowledgedOperationIds` and only those leave the queue.
- `last_sync_timestamp` is server-issued and drives the next pull.
- Failed pushes retry with backoff `5s * 2^attempts`, capped at 15 minutes.
- Budgets and Notifications stay online-only writes.

## Consequences

- Every pushed Transaction needs a `categoryId`; the queue cannot repair missing references.
- Device clock skew can win or lose last-write-wins conflicts.
- Correctness depends on the queue and the local row staying consistent; known defects are listed in `.claude/rules/sync.md`.
- Adding a new offline entity means a repository, a queue entity type and server handling in `sync_client_state`.
