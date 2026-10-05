# 0002 - Supabase with RPC-first backend

- Status: Accepted; Liquidation callers and scheduler cadence amended by 0006
- Date: 2026-10-05

## Context

The app needs auth, a relational store with per-user isolation, scheduled game settlement and push dispatch, without running a custom server.

## Decision

- Supabase hosts auth, Postgres and edge functions. The daily batch is triggered by a GitHub Actions cron (`daily-liquidation-scheduler.yml`), with optional `pg_cron` registration in the scheduler migration.
- Schema lives in ordered SQL files in `supabase/migrations/`; `202603110001_h2_baseline.sql` drops and recreates the `public` schema as the baseline.
- Row Level Security is enabled on every table with owner-only policies.
- Multi-row or game logic runs in Postgres functions called as RPCs: `complete_onboarding`, `get_monthly_dashboard`, `sync_client_state`, `process_daily_liquidation` (security definer with explicit caller checks, idempotent on `period_key`) and `run_daily_liquidation_batch` (service_role only).
- Push delivery runs in the Deno edge function `supabase/functions/expo-push-dispatcher`, fed by a notification queue table.
- The client reaches Supabase only through `services/`; request and response types are hand-written in each service.

## Consequences

- No generated `Database` types: an RPC contract change must update the calling service's types in the same change.
- Business rules split between SQL and TypeScript; SQL functions are tested through the RPC, not unit tests.
- Applied migrations are immutable; every schema change is a new migration.
- Known gap: the dispatcher's due query re-picks terminal `FAILED` rows because it has no attempts cap.
