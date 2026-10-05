# 0006 - Game rules and Liquidation v2

- Status: Accepted
- Date: 2026-10-05
- Amends: 0002 (Liquidation callers, scheduler cadence)

## Context

Liquidation v1 never raises a Streak from 0 (`202603110007_h13_daily_liquidation_rpc.sql:109-116`), is callable by any signed-in user (`:201`), runs once a day for everyone in UTC, and users can write `castle_states` and `user_wallets` directly (`202603110002_h3_rls_policies.sql:22-23`). HP moves by daily heal/damage deltas unrelated to the budget. The game must reward logging daily and staying inside the monthly budget, and must not be forgeable from the client.

## Decision

**Rules.** Numbers live only in `docs/prd/v1.md` (Game rules) and the domain constants; they are tunable without a new ADR.
- Streak: consecutive local days that count. A day counts with at least one non-deleted Transaction (expense or income) dated that day, or a "Hoy sin gastos" check-in for it.
- Castle HP is a pure function of the month's total budget and month-to-date expenses (remaining-budget share vs remaining-month share). It is recomputed from all data, never accumulated from deltas, so it is 100 at month start before any spending and a late expense moves it at once.
- Alerts (80% / 100%) fire for the total budget and for each category Límite; Límites never affect HP.
- Damage is visual: HP selects the Castle state; Mejoras bought with Gold are permanent and never lost.
- Gold is credited only by Liquidation, for a day that counts and is within budget. Income never changes HP or Gold.
- An Escudo is consumed automatically for a day that does not count while Streak > 0, holding the Streak.

**Authority.** The server decides Gold, Streak, Escudos and the recorded HP. The client computes the same pure HP and Asignación diaria functions only as a preview.

**Scheduling.** The profile stores the user's IANA timezone, updated from the device at app start. An hourly job (GitHub Actions or `pg_cron`) calls `run_daily_liquidation_batch()`, which liquidates, oldest first, every local day of each user that has closed and has no ledger entry.

**Ledger.** `game_liquidation_events` keeps one row per `(user_id, day)`: counted, Streak before/after, Escudo used, Gold earned, HP and state at close, `rules_version`. A second run for the same day is a no-op. The ledger row is the Parte de batalla.

**Late entries.** When a Transaction or check-in syncs for a day whose Liquidation ran less than 48 h earlier and the day did not count, the sync RPC records a repair request; the next batch re-evaluates that day only in the user's favor: the day counts, the Streak is recomputed forward, a consumed Escudo is returned. Gold of a closed day never changes, including its +5 Streak bonus; a repair changes the Streak only going forward. Records older than the window still count for HP and history.

**Permissions.**
- `process_daily_liquidation` and the batch are executable only by `service_role`.
- RLS gives `authenticated` select-only on Castle, Wallet, ledger, Mejoras owned, notification logs and the dispatch queue.
- Spending Gold goes through user-callable `security definer` RPCs (`purchase_upgrade`, `purchase_shield`) that check `auth.uid()`, balance, tier order and the Escudo cap atomically. They are online-only.

**Notifications** are enqueued by the server with a `send_after` time in the user's timezone: Racha en riesgo, Presupuesto 80%/100% (once per Period, scope and threshold), Parte de batalla. The dispatcher caps attempts, ends in a terminal state and handles results per push token.

## Alternatives considered

- **Client-side Liquidation.** Rejected: Gold and Streak would be forgeable and multi-device would double-count.
- **One UTC batch per day.** Rejected: a day would close at a different local hour per user, and late-evening entries would land in the wrong day.
- **HP as accumulated heal/damage deltas (v1).** Rejected: it drifts from the budget it is meant to show and cannot absorb late entries.

## Consequences

- The scheduler must run hourly; a missed run is caught up by the next one.
- The Racha en riesgo push only sees synced data; an offline log does not suppress it.
- Rule changes bump `rules_version`; closed ledger rows are never rewritten except by the 48 h repair.
