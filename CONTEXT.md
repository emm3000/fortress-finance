# Domain glossary

Format: **Code term** - UI copy (Spanish) - meaning.

- **Transaction** - "Botín de Guerra" (INCOME) / "Batalla" (EXPENSE); amount "Monto de Oro"; description "Notas de Batalla" - a real-money movement of type `INCOME` or `EXPENSE`, created offline and synced.
- **Category** - "categoría" - global, read-only classification typed `INCOME` or `EXPENSE`; every synced Transaction has one.
- **Budget** - "Presupuestos" - spending limit per user, Category and Period; recurrence is always `MONTHLY`; online-only write.
- **Period** - (no UI label) - calendar month as `{ year, month }`; the unit for budgets and the monthly dashboard.
- **Castle** - "Fortaleza" - the user's game avatar with `hp`, `max_hp` and `status` (`HEALTHY`, `UNDER_ATTACK`, `RUINS`).
- **Wallet** - (no UI label) - per-user game state: `gold_balance` and `streak_days`.
- **Gold** - (no UI label) - game currency in the Wallet, credited by Liquidation; not real money.
- **Streak** - "Racha Actual" - day count kept by Liquidation; a positive Streak heals the Castle and earns Gold, zero damages it.
- **Liquidation** - (no UI label) - idempotent daily settlement per user and `period_key` that updates Castle HP, Gold and Streak.
- **Sync operation** - "Sincronizado" / "Sincronizar datos" - queued local write (one per entity) waiting for server acknowledgement.
- **Notification** - "Centro de alertas" - server-generated message for the user, also dispatched as push; read state changes online only.

## Synonyms resolved

- Castle is the code term and "Fortaleza" the UI term. Keep "fortress" and "reino" out of identifiers (the repo name is historical).
- Notification is the domain term; `alerts` is only its route and screen name.
- Transaction `description` (client) maps to `notes` (server column); use `description` in client code.
- Local table `castle_state` merges server tables `castle_states` and `user_wallets`; Castle and Wallet stay separate terms.
- "Oro" in "Monto de Oro" labels a real-money Transaction amount; in code, Gold always means the game currency.
- JAA is the app name everywhere user-facing.

## Known gaps

- Money is stored as SQLite `REAL` locally and `numeric(10,2)` on the server; the client coerces with `Number()`, so amounts are floats.
- `user_preferences.currency` exists but the client never reads it; amounts render without currency formatting.
- Period bounds are computed in local time on the device while server aggregates use UTC month bounds.
