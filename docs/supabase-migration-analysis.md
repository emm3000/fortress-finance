# Backend Migration Analysis to Supabase

## Context

Define a realistic path to replace the legacy `Express + Prisma + PostgreSQL` backend
with a Supabase-first architecture, reducing operational complexity and preserving the
current mobile product behavior.

## Objectives

- Use Supabase Postgres as the primary database.
- Use Supabase Auth for authentication and session lifecycle.
- Use RLS for strict per-user data isolation.
- Keep the offline-first sync model in the mobile app.
- Remove runtime dependency on the legacy backend for v1.

## Current State Summary

Legacy backend responsibilities included:

- Auth and password reset flows
- Offline sync orchestration (`/api/sync`)
- Dashboard aggregations
- Onboarding bootstrap and profile setup
- Budgets and categories access
- Notifications registration/read paths
- Home state support (castle/wallet)

## Key Findings

1. The frontend is already prepared for layered migration.
2. The most sensitive flow is sync orchestration and conflict handling.
3. The legacy backend acted as both API and worker-like runtime.
4. Maintaining the custom backend on PaaS adds unnecessary ops burden.
5. Supabase can cover v1 critical paths without requiring Edge Functions for core runtime.

## Recommended Target Architecture (v1)

- Supabase Auth for signup/login/session/password recovery
- Supabase Postgres as remote source of truth
- SQL RPC for composed operations:
  - `complete_onboarding(...)`
  - `get_monthly_dashboard(...)`
  - `sync_client_state(...)`
- RLS policies on all user-scoped tables
- Mobile app keeps local SQLite + sync queue for offline-first behavior

## Data Model Scope for Migration

Core tables in Supabase:

- `profiles`
- `categories`
- `transactions`
- `budgets`
- `castle_states`
- `user_wallets`
- `user_preferences`
- `user_initial_categories`
- `notification_logs`
- `user_push_tokens`

## What Moves Directly to Supabase

- Authentication and session lifecycle
- User-owned CRUD data paths
- Dashboard monthly aggregation (RPC)
- Offline sync push/pull reconciliation (RPC)
- Basic notifications read + push token registration

## What Is Deferred (Phase 2)

- Daily liquidation scheduler/game engine automation
- Automatic push notification pipeline and dedupe
- Worker-heavy background orchestration

## Why This Is Preferable to Keeping Legacy Backend

- Fewer moving parts to operate
- Simpler security model via RLS and Auth
- Better fit for mobile-first offline architecture
- Faster iteration on SQL contracts for product flows

## Risk Areas

- Sync conflict semantics (`updated_at` and tie behavior)
- Environment drift across dev/qa/prod (URL/key/project mismatch)
- Missing SQL objects in target project during rollout
- Categories seed consistency (foreign key dependencies)

## Mitigations

- Migration backlog with atomic stories
- Cutover checklist + smoke runbook
- Validation queries for tables/functions/RLS/seed
- Incremental rollout and rollback procedure

## Final Recommendation

Proceed with Supabase as the primary backend surface for v1 and keep the legacy
Express backend out of frontend runtime.

This migration is viable and operationally preferable for the current project scope.

## References

- Supabase with Expo: https://supabase.com/docs/guides/with-expo
- Supabase Auth: https://supabase.com/docs/guides/auth
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Edge Functions: https://supabase.com/docs/guides/functions
- Cron and scheduling: https://supabase.com/docs/guides/cron
