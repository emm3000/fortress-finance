# Supabase Migration Backlog

## Backlog Goal

Break down migration from the legacy backend to Supabase into implementable stories
with small, traceable subtasks suitable for atomic commits.

## Execution Rules

- one subtask = one small reviewable change
- one subtask should ideally map to one commit
- avoid mixing docs/infrastructure/code in one commit unless necessary
- mark a story complete only when acceptance criteria are met
- do not start phase 2 work before v1 stability

## Status Convention

- [ ] pending
- [x] completed
- [-] deferred

---

## H1. Supabase Bootstrap and Environment Contract

### Goal

Prepare the project to use Supabase from frontend runtime without breaking local development.

### Atomic Subtasks

- [x] Install `@supabase/supabase-js` in root project.
- [x] Create shared Supabase client in frontend.
- [x] Define `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [x] Document local Supabase setup.
- [x] Verify frontend compiles without `EXPO_PUBLIC_API_URL`.

### Acceptance Criteria

- frontend can initialize valid Supabase client
- new env vars are documented
- app startup is not blocked by missing `EXPO_PUBLIC_API_URL`

---

## H2. Base Schema in Supabase

### Goal

Create remote database baseline replacing active v1 backend tables.

### Atomic Subtasks

- [x] Create SQL migration for `profiles`.
- [x] Create SQL migration for `categories`.
- [x] Create SQL migration for `transactions`.
- [x] Create SQL migration for `budgets`.
- [x] Create SQL migration for `castle_states` and `user_wallets`.
- [x] Create SQL migration for `user_preferences` and `user_initial_categories`.
- [x] Create SQL migration for `notification_logs` and `user_push_tokens`.
- [x] Add indexes for sync/user filters/dashboard.
- [x] Add idempotent seed for base categories.

### Acceptance Criteria

- all v1-required tables exist
- sync/dashboard indexes exist
- category seed can run without duplicates

---

## H3. Security with RLS

### Goal

Guarantee each user can only read/write their own data.

### Atomic Subtasks

- [x] Enable RLS on `profiles`.
- [x] Enable RLS on `transactions`.
- [x] Enable RLS on `budgets`.
- [x] Enable RLS on `castle_states` and `user_wallets`.
- [x] Enable RLS on `user_preferences` and `user_initial_categories`.
- [x] Enable RLS on `notification_logs` and `user_push_tokens`.
- [x] Add authenticated read-only policy for `categories`.
- [x] Manually validate no cross-user reads.

### Acceptance Criteria

- all user tables protected by `auth.uid()`
- `categories` readable by authenticated users
- no cross-user data access

---

## H4. Auth Migration to Supabase

### Goal

Replace custom backend auth with Supabase Auth in Expo frontend.

### Atomic Subtasks

- [x] Migrate login to `signInWithPassword`.
- [x] Migrate signup to `signUp`.
- [x] Migrate logout to Supabase sign-out.
- [x] Adapt `auth.store` to persist/hydrate Supabase session.
- [x] Listen to auth state changes and update global state.
- [x] Migrate password recovery/reset to Supabase.
- [x] Remove manual axios bearer token plumbing.

### Acceptance Criteria

- signup/login/logout work
- session persists across app restart
- password reset no longer depends on Express backend

---

## H5. User Bootstrap and Onboarding

### Goal

Automatically create baseline state for new users and migrate onboarding flow.

### Atomic Subtasks

- [x] Create trigger/function to bootstrap `profiles` on signup.
- [x] Create trigger/function to bootstrap `castle_states`.
- [x] Create trigger/function to bootstrap `user_wallets`.
- [x] Implement RPC `complete_onboarding`.
- [x] Adapt `OnboardingService` to new RPC.
- [x] Keep local draft and cleanup behavior after sync.

### Acceptance Criteria

- new user has profile, castle, wallet
- onboarding stores preferences correctly
- initial categories assigned once

---

## H6. Categories from Supabase

### Goal

Replace categories endpoint with direct Supabase reads while preserving local cache.

### Atomic Subtasks

- [x] Add remote categories query in frontend.
- [x] Adapt `SyncService.syncCategories` to stop calling `/categories`.
- [x] Preserve SQLite persistence via `CategoryRepository`.
- [x] Validate category use in forms and filters.

### Acceptance Criteria

- categories come from Supabase
- categories still persist locally
- dependent UI behavior remains unchanged

---

## H7. Budgets on Supabase

### Goal

Move budgets flow to Supabase while keeping current online-only UX.

### Atomic Subtasks

- [x] Migrate budget reads to Supabase.
- [x] Migrate budget upserts to Supabase.
- [x] Keep React Query invalidation for budgets and dashboard.
- [x] Validate user ownership and category uniqueness constraints.

### Acceptance Criteria

- list and save budgets work
- save still fails appropriately without internet
- cross-user budget writes are blocked

---

## H8. Monthly Dashboard via RPC

### Goal

Move dashboard aggregation to SQL/RPC while preserving response contract.

### Atomic Subtasks

- [x] Implement RPC `get_monthly_dashboard(year, month)`.
- [x] Keep current dashboard response shape.
- [x] Migrate `DashboardService` to RPC.
- [x] Validate home behavior with and without month data.

### Acceptance Criteria

- dashboard returns income/expense/balance/top categories
- home empty states remain correct

---

## H9. Offline-first Sync via RPC

### Goal

Preserve offline-first model without Express backend.

### Atomic Subtasks

- [x] Define RPC signature for `sync_client_state`.
- [x] Implement transaction push with ownership + `updated_at`.
- [x] Implement soft-delete sync via `deleted_at`.
- [x] Implement incremental pull from `last_sync_timestamp`.
- [x] Include `castle` and `wallet` in payload.
- [x] Migrate `services/sync.service.ts` to RPC.
- [x] Preserve local queue and backoff UX.
- [x] Validate older-timestamp and equal-timestamp conflict behavior.

### Acceptance Criteria

- create/edit/delete offline still works
- queue drains after reconnect
- ownership and reconciliation rules preserved

---

## H10. Basic v1 Notifications

### Goal

Keep alerts screen functional without automation pipeline yet.

### Atomic Subtasks

- [x] Migrate `notification_logs` reads to Supabase.
- [x] Migrate `user_push_tokens` registration path for v1.
- [x] Ensure alerts screen handles empty state without errors.

### Acceptance Criteria

- alerts screen opens without failure
- empty notifications show correct empty state

---

## H11. Remove Express Backend Dependency

### Goal

Leave frontend runtime without residual `/api/*` calls.

### Atomic Subtasks

- [x] Remove `services/api.client.ts` from main runtime flow.
- [x] Remove axios if unused.
- [x] Search/remove residual `/api/` calls.
- [x] Update README and deployment docs.

### Acceptance Criteria

- no active `/api/*` calls remain
- Express backend can be turned off for v1

---

## H12. Cutover QA

### Goal

Have a validation checklist before declaring v1 migration closed.

### Atomic Subtasks

- [x] Validate signup/login/logout on device and simulator.
- [x] Validate complete onboarding for new user.
- [x] Validate offline -> online transaction flow.
- [x] Validate budgets and dashboard with real test user.
- [x] Validate home with castle/wallet and no phase-2 features.
- [x] Document cutover checklist and simple rollback.

### Acceptance Criteria

- evidence exists for critical flow validation
- cutover checklist exists
- simple rollback is documented

---

## Phase 2 Execution Status

Execution reference:
- `docs/phase2-atomic-task-plan.md`
- `docs/phase2-rollout-checklist.md`
- `docs/phase2-closure-plan.md`

### H13. Daily Liquidation and Game Engine

- [x] Implement scheduler for daily liquidation via external scheduler (`.github/workflows/daily-liquidation-scheduler.yml`).
- [x] Port damage/heal/streak/gold rules.
- [x] Persist game events and post-liquidation states.

### H14. Automatic Push Notifications

- [x] Create Edge Function for Expo push delivery.
- [x] Add notification dedupe rules.
- [x] Integrate scheduler with game events (GitHub Actions scheduler + dispatcher invocation).

### Phase 2 Validation Summary

- [x] Remote database reset and migration rollout completed (`zxdnuxqrogxlsumlzdlv`).
- [x] Edge Function `expo-push-dispatcher` deployed.
- [x] Device push token registration confirmed in `user_push_tokens`.
- [x] Manual push delivery (`curl`) confirmed on Android device.
- [x] Queue -> dispatcher -> `notification_logs` (`SENT`) confirmed.
- [x] Daily automatic scheduler finalized with external workflow (no dependency on `pg_cron`).

---

## Final Migration Status

1. H1 Supabase bootstrap and env contract
2. H2 Base schema in Supabase
3. H3 Security with RLS
4. H4 Supabase Auth migration
5. H5 User bootstrap and onboarding
6. H6 Categories from Supabase
7. H7 Budgets on Supabase
8. H8 Monthly dashboard via RPC
9. H9 Offline-first sync via RPC
10. H10 Basic v1 notifications
11. H11 Remove Express dependency
12. H12 Cutover QA

v1 expected outcome:

- auth runs on Supabase
- categories, budgets, onboarding, dashboard, and sync no longer depend on Express runtime
- no active `/api/*` calls in frontend runtime
- home remains usable with castle and wallet state
- cutover checklist is documented and closed
