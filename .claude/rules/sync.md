---
paths:
  - "db/**"
  - "services/sync*"
  - "hooks/useSync*"
  - "hooks/useTransactionCommands*"
  - "supabase/migrations/**"
---

# Sync invariants

Decision record: `docs/adr/0001-offline-first-local-writes.md`.

- Generate Transaction ids on the client with `Crypto.randomUUID()`; the same id is the server primary key.
- Set `updatedAt` as ISO-8601 UTC on every local write; `sync_client_state` resolves conflicts by last-write-wins on it.
- Delete by setting `deleted_at`; every read query filters `deleted_at IS NULL`.
- Enqueue through the sync queue repository, which upserts the single `sync_operations` row per entity (UNIQUE `user_id, entity_type, entity_id`) so the last payload wins.
- Keep each operation's `operationId` stable across retries; remove an operation only when the server lists it in `acknowledgedOperationIds`.
- Store `last_sync_timestamp` exactly as the server returns it.
- Include `categoryId` in every pushed Transaction payload.
- Retry with backoff `5s * 2^attempts`, capped at 15 minutes (constants in `services/sync.service.ts`).
- Write Budgets and Notifications online only; they never enter the queue.
- A change to the `sync_client_state` contract ships as a new migration plus the matching types in `services/sync.service.ts`.

## Known gaps

- Pull overwrites local rows that still have pending operations.
- Server `BEFORE UPDATE` trigger `set_updated_at` replaces the client `updatedAt` on update.
- `last_sync_timestamp` is global, not per user, and logout does not clear SQLite.
- Creating a Transaction writes the row and the queue entry outside one SQLite transaction.
