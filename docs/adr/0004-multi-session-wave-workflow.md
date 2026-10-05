# 0004 - Multi-session wave workflow on GitHub Issues

- Status: Accepted
- Date: 2026-10-05

## Context

Work is planned and run with several Claude Code sessions in parallel. Without one board, one isolation scheme and one review rule, peers collide on the checkout, on Metro's port and on the Supabase schema, and the model chosen per kind of work stays opinion. The owner already runs this loop in another repo; this ADR adapts it to an Expo app with an offline-first sync contract.

## Decision

- **Board.** GitHub issues labelled `ready-for-agent` are the only work list. Each carries at most 3 lines of context and a `Done when` checklist of falsifiable conditions, ending with `npm run check` green. No doc holds a backlog. Issues come from the `ticket-writer` agent.
- **Waves.** An orchestrator session dispatches each ticket to its own peer session through the `/wave` skill (`.claude/skills/wave/SKILL.md`). One ticket per peer, one PR per ticket with `Closes #N`. Tickets in one wave touch disjoint files. A wave starts only after the previous one is merged.
- **Wave of one.** A ticket labelled `wave-of-one` runs alone: a new file in `supabase/migrations/`, a change to RPC `sync_client_state` or any RPC contract, RLS, or the local SQLite schema in `db/database.ts`.
- **Isolation.** Each peer works in its own worktree `../fortress-finance-<name>` detached from `origin/main`, with its own `npm ci` install and its own Metro port (`8082` upwards, assigned by wave position; `8081` stays the owner's). A peer that needs a device boots its own simulator or emulator.
- **Database.** Peers run no database by default: `npm run check` mocks Supabase at the module boundary. A visual check runs the app against the project the owner's untracked `.env` points at, which must be the development project, with a test account. Peers never apply migrations or run SQL against a hosted project; the owner applies a merged migration.
- **Review and merge.** Every PR gets a fresh `pr-reviewer` (MERGE or FIX FIRST). `main` is the only long-lived branch and merges are rebase-only.
- **Tuning.** Model and effort per kind of work are written only in the wave skill's table and tuned from `docs/agents/dispatch-log.md`.
- **Cycle close.** When merged work changes a domain term, an invariant or an architecture decision, the orchestrator files a docs ticket that loads `mattpocock-skills:domain-modeling` and updates `CONTEXT.md` and `docs/adr/`.

The procedure lives in `docs/agents/multi-session.md`.

## Alternatives considered

- **Per-peer local Supabase** (`supabase start` per worktree with offset ports and a distinct `project_id`). Rejected for now: the repo has no `supabase/config.toml`, and the local stack is about ten Docker containers per peer. Since schema work is already a wave of one, a single local stack would be enough once a ticket adds `config.toml`; port offsets would still be unnecessary.
- **Shared hosted project for every peer.** Rejected as the default: the baseline migration drops and recreates `public`, and parallel peers writing test data to one project make sync results unreproducible.
- **Cloning the main checkout's `node_modules`** (APFS copy-on-write) instead of `npm ci`. Rejected: it inherits whatever drift the owner's checkout has from the lockfile; `npm ci --prefer-offline` from a warm cache is slower but exact.

## Consequences

- Most tickets need neither network nor device; sync and schema tickets serialize.
- Each worktree pays one `npm ci`.
- The project settings deny `git push --force-with-lease`, so a peer cannot push a rebased branch; the owner runs that push when a PR conflicts.
- GitHub still allows merge and squash on this repo; rebase-only holds by practice until those options are disabled in the repo settings.
- Every merge to `main` that touches app code triggers `android-qa-firebase.yml`, so each wave PR produces a QA build.
- The dispatch log starts empty; every table row is a bet until the log says otherwise.
