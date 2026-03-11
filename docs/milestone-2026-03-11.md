# Milestone 2026-03-11

## Scope Reached

This milestone closes the migration and rollout effort up to:

- Supabase-first runtime for app data/auth flows.
- Offline-first sync through SQL RPC contracts.
- Phase 2 daily liquidation and automated push dispatch running in production path.

## Completed

1. Migration baseline (H1-H12)
- Supabase schema, RLS, auth, onboarding, categories, budgets, dashboard, and sync are live.
- Frontend runtime no longer depends on legacy `/api/*` backend routes.

2. Phase 2 automation (H13-H14)
- Liquidation rules and event persistence are active.
- Notification queue + dispatcher are active.
- External daily scheduler is configured via GitHub Actions.

3. Operational validation
- Remote migrations aligned with repo migration set.
- Dispatcher invocation path fixed and verified.
- End-to-end push delivery observed on device.

## Current Operational State

- Status: Operational.
- Scheduler model: external workflow (GitHub Actions), no dependency on `pg_cron`.
- Function status: `expo-push-dispatcher` active.

## Remaining Ongoing Controls

These are monitoring controls, not open project gaps:

1. Keep daily scheduler enabled.
2. Monitor run logs and queue health.
3. Keep idempotency duplicate query clean.
4. Track notification success/failure ratio.

## Canonical Docs After Consolidation

- Architecture: `docs/architecture.md`
- Operations: `docs/operations.md`
- Historical references: `docs/archive/`
