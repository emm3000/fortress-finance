# JAA

Gamified personal-finance app (Expo SDK 55 + React Native, Supabase backend): users log income and expenses against monthly category budgets, and a daily server-side Liquidation updates their Castle, Gold and Streak. Offline-first: the phone's SQLite is the working copy, Supabase is the shared truth.

## Offline-first invariants

- Transaction ids are client-generated UUID v4 (`Crypto.randomUUID`) and are the server primary key.
- `updatedAt` is ISO-8601 UTC and drives last-write-wins inside RPC `sync_client_state`.
- Deletes are soft (`deleted_at`); every read filters `deleted_at IS NULL`.
- One `sync_operations` row per entity; a new write upserts it and the last payload wins.
- Each queued operation keeps a stable `operationId`; it leaves the queue only when listed in the server's `acknowledgedOperationIds`.
- `last_sync_timestamp` comes from the server, never from the device clock.
- Budgets and notifications are online-only writes; they never enter the sync queue.

Details and known gaps: `.claude/rules/sync.md`.

## Layers as they are today

- `app/` - expo-router screens.
- `hooks/` - React Query hooks; the only place `useQuery` lives.
- `services/` - `XService` object literals calling Supabase RPCs.
- `db/` - `XRepository` modules over expo-sqlite; only `db/database.ts` opens the database.
- `store/` - zustand stores (auth, network).
- `constants/` - query-key factory and theme.
- `utils/` - small shared helpers.

Known inconsistencies (some hooks read repositories directly, some screens call services, services and stores import each other, mixed file casing) are recorded in `docs/adr/0003-target-architecture.md`, which also defines where new code goes.

## Gate

`npm run check` must pass before a change is done. The `check` skill runs it and summarizes failures.

## Conventions not enforced by config

- Code, identifiers, comments, commits and docs in English; user-facing copy in Spanish.
- Conventional commits with a scope (`sync`, `ui`, `auth`, `db`, `eas`, `ci`, `notifications`, `expo`, ...).
- Commits and PRs carry no AI attribution or `Co-Authored-By` lines (a hook blocks them).
- Route files under `app/` use a default export; every other module uses named exports.
- Style with NativeWind `className`. When a skill suggests inline `style` objects, keep `className` instead.

## Where to look

| Need | Source |
| --- | --- |
| Domain vocabulary, UI copy, synonyms | `CONTEXT.md` |
| Architecture decisions | `docs/adr/` |
| Path-scoped rules (load automatically for matching files) | `.claude/rules/` |
| Environments, scheduler, incident response | `docs/operations.md` |
| System overview (partly superseded by ADRs; ADRs win) | `docs/architecture.md` |

## Workflow

The board is `gh issue list --label ready-for-agent`; work runs in waves of parallel peer sessions, one ticket and one worktree each, merged rebase-only into `main` (ADR 0004). Before dispatching a ticket or booting peers with `/wave`, read `docs/agents/multi-session.md`. Tickets come from the `ticket-writer` agent; labels and `gh` usage are in `docs/agents/`.

## Skill routing

- `mattpocock-skills`: `tdd` for features and bug fixes, `diagnosing-bugs` for failures, `domain-modeling` when editing `CONTEXT.md` or an ADR, `grilling` to stress-test a plan, `code-review` for branch reviews (or the `pr-reviewer` agent), `research` for reading legwork against primary sources, `writing-for-agents` when editing a skill, rule, agent or this file. The owner runs `/mattpocock-skills:to-tickets` to split a grilled plan into tickets.
- `expo` plugin: Expo SDK, expo-router, EAS build and upgrade work.
