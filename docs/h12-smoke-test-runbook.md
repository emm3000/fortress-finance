# H12 Smoke Test Runbook (30-40 min)

Date: 2026-03-11  
Goal: close H12 `PENDING` items with minimal verifiable evidence.

## Preparation (5 min)

1. Verify frontend has:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Start app:
   - `npx expo start`
3. Keep Supabase open (SQL editor / table editor) to check:
   - `profiles`
   - `castle_states`
   - `user_wallets`
   - `user_preferences`
   - `transactions`
   - `user_push_tokens`
   - `notification_logs`

## Required Evidence Per Test

- 1 UI screenshot (final state)
- 1 data evidence point (row in Supabase or visible state in app)
- Result: `PASS` or `FAIL`
- If failing: exact error text and step where it fails

## Block A: Auth (8 min)

1. Signup on simulator:
   - Register new user.
   - Expected: enters authenticated flow.
2. Logout:
   - Sign out.
   - Expected: returns to login.
3. Login:
   - Login with same user.
   - Expected: successful access.
4. Repeat 1-3 on physical device.

DB checks:
- `profiles.id = auth.users.id` exists

## Block B: Onboarding (5 min)

1. Use new user.
2. Complete onboarding.
3. Expected:
   - preferences saved
   - no session errors

DB checks:
- row exists in `user_preferences`
- rows exist in `castle_states` and `user_wallets` for user

## Block C: Offline -> Online Sync (8 min)

1. With active session, set device offline.
2. Create transaction.
3. Edit that transaction.
4. Delete it (soft delete).
5. Go online and force sync (pull-to-refresh or sync action).
6. Expected:
   - local queue drains
   - no sync errors remain

DB checks:
- transaction exists with `deleted_at` not null (if applicable)
- no duplicates by `id`

## Block D: Budgets + Dashboard (7 min)

1. Create/edit budget for expense category.
2. Verify dashboard refresh.
3. View dashboard with data.
4. Test month without data (if UI supports) or clean user.

Expected:
- save succeeds
- dashboard shape stays consistent and UI does not break

## Block E: Home (3 min)

1. Open home after login.
2. Expected:
   - castle renders (HP/status)
   - wallet renders (gold/streak)
   - no broken placeholders

## Block F: Alerts and Push Token (4 min)

1. Open alerts screen with empty data.
2. Expected:
   - correct empty state
   - no crash
3. With push permissions enabled:
   - validate token registration
   - logout and validate unregister

DB checks:
- insert/delete in `user_push_tokens`

## Exit Criteria

H12 is considered closed when:
- all blocks A-F = `PASS`
- minimal evidence exists per block
- `docs/migration-cutover-checklist.md` is updated with final results

If there is a critical `FAIL`:
- do not cut to production
- log issue with minimal reproducible steps
- fix-forward and rerun affected block
