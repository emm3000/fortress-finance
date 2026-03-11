# Cutover Checklist (Supabase v1)

Last updated: 2026-03-11

Operational runbook:
- `docs/h12-smoke-test-runbook.md`

## 1. Technical Gate Before Cutover

- [x] Frontend typecheck is green.
  Command: `npx tsc --noEmit`
- [x] Frontend lint is green.
  Command: `npm run lint`
- [x] No active calls to legacy API client (`/api/*`, `api.client`, `axios`) in frontend runtime.
  Command: `rg -n "apiClient|api\.client|/api/|EXPO_PUBLIC_API_URL|axios" app components constants db hooks services store utils --glob '!package-lock.json'`

## 2. Functional Smoke Tests (Manual)

Status:
- `DONE`: validated with evidence
- `PENDING`: manual execution pending
- `BLOCKED`: cannot run in current environment

### Auth

- [x] `DONE` Signup on physical device.
- [x] `DONE` Login on physical device.
- [x] `DONE` Logout on physical device.
- [x] `DONE` Signup/Login/Logout on simulator.

### Onboarding

- [x] `DONE` New user completes onboarding and preferences persist.
- [x] `DONE` Re-entry keeps initial state stable (profile/castle/wallet already created).

### Offline-first Sync

- [x] `DONE` Create transaction offline.
- [x] `DONE` Edit transaction offline.
- [x] `DONE` Delete transaction offline (soft delete).
- [x] `DONE` Reconnect and confirm sync queue drain.
- [x] `DONE` Conflict with older timestamp (client loses).
- [x] `DONE` Tie on equal timestamp (expected behavior defined and validated).

### Budgets + Dashboard

- [x] `DONE` Create/edit budget for expense category.
- [x] `DONE` Confirm dashboard invalidation after budget save.
- [x] `DONE` View dashboard with month data.
- [x] `DONE` View dashboard without month data (correct empty state).

### Home (castle/wallet)

- [x] `DONE` Home renders castle and wallet for new user.
- [x] `DONE` Home renders stable state after sync.

### Notifications v1

- [x] `DONE` Alerts screen opens without error with empty list.
- [x] `DONE` Push token register/unregister in `user_push_tokens`.

## 3. Automated Evidence Recorded in This Iteration

- `frontend` typecheck: OK
- `frontend` lint: OK
- legacy endpoints scan in frontend runtime: OK (no matches)
- manual smoke A-F: OK (all cases in `DONE`)
- Supabase migrations validation: OK
  - RLS enabled on critical tables
  - RPCs available: `complete_onboarding`, `get_monthly_dashboard`, `sync_client_state`
  - base categories seed: `8` rows

## 4. Cutover Plan

1. Freeze unrelated functional changes.
2. Apply pending SQL migrations in Supabase from repo `supabase/migrations/`.
3. Validate frontend env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
4. Run full manual smoke suite (section 2) on simulator and at least one physical device.
5. Enable frontend release.
6. Monitor auth, sync, and dashboard errors during initial window.

## 5. Final Status

- Supabase v1 cutover completed.
- Frontend has no active dependency on legacy Express backend at runtime.
- Manual and technical validation checklist is closed.

## 6. Simple Rollback

Rollback condition:
- critical failure in auth, transaction sync, or dashboard blocking main flow.

Actions:
1. Stop rollout of new build.
2. Revert to previous stable mobile build.
3. Keep new Supabase tables/functions without deleting data.
4. Record incident with:
   - affected version/build
   - broken flow
   - involved SQL query/function
   - minimal reproduction
5. Open fix-forward in a new branch and rerun full smoke before new release.
