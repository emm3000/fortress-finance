# Domain glossary

Format: **Code term** - UI copy (Spanish) - meaning. Terms describe the v1 model (`docs/prd/v1.md`); where the running code still differs, see Known gaps.

## Money and records

- **Transaction** - "registro"; types "Gasto" (`EXPENSE`) / "Ingreso" (`INCOME`); note "Nota" - a real-money movement on one Day, written offline and synced. Themed type labels are an open item in the PRD.
- **Amount** - "Monto" - a Transaction's value as an integer count of Minor units in the user's Currency, always positive.
- **Minor unit** - (no UI label) - the smallest unit of a Currency (a céntimo of PEN, a cent of USD; CLP has none below the peso).
- **Currency** - "Moneda" - the one ISO 4217 currency a user records in, chosen at onboarding.
- **Category** - "categoría" - one of a fixed, curated set identified by a stable slug and typed `INCOME` or `EXPENSE`; users cannot create or edit them.
- **Day** - (no UI label) - a local calendar date `YYYY-MM-DD` in the user's timezone; every Transaction belongs to exactly one.
- **Period** - "mes" - a calendar month `YYYY-MM`, derived from Days; the unit of budgets, HP and the Monthly summary.

## Budget

- **Budget plan** - "Presupuesto" - the user's monthly plan: a Monthly budget plus optional Category limits. It repeats every Period until changed; a change applies from the current Period.
- **Monthly budget** - "Presupuesto del mes" - the required total spending cap of a Period; the only budget input to Castle HP.
- **Category limit** - "Límite" - an optional cap for one expense Category inside a Budget plan; it only raises alerts at 80% and 100%.
- **Daily allowance** - "Disponible hoy" - what is left of the Monthly budget divided by the Period's remaining Days, today included.
- **Day within budget** - (no UI label) - a Day whose expenses stay inside its Daily allowance without the Period exceeding its Monthly budget.
- **Monthly summary** - "Resumen del mes" - spend by Category vs Límites, total vs Monthly budget, ingresos − gastos, and change vs the previous Period.

## Game

- **Castle** - "Castillo" - the user's game avatar; its HP (0-100) mirrors the Period's Monthly budget, and its state is `HEALTHY` "En pie", `UNDER_ATTACK` "Asediado" or `RUINS` "En ruinas".
- **Upgrade** - "Mejora" - a permanent Castle part bought with Gold, in lines and ordered tiers; never lost to damage.
- **Shield** - "Escudo" - a consumable bought with Gold that holds the Streak through one Day that does not count.
- **Wallet** - (no UI label) - per-user game balances: Gold, Streak and Shields held.
- **Gold** - "Oro" - game currency earned by Liquidation and spent on Mejoras and Escudos; never real money.
- **Streak** - "Racha" - consecutive Active days up to the last Liquidation.
- **Active day** - (no UI label) - a Day with at least one Transaction of either type or a Check-in; the only thing the Streak counts.
- **Check-in** - "Hoy sin gastos" - the user's explicit statement that today had no expenses; it makes today an Active day.
- **Liquidation** - (no UI label) - the server's settlement of one user's Day after its local midnight: Streak, Shield use, Gold and recorded HP.
- **Battle report** - "Parte de batalla" - the result of one Liquidation as the user sees it; their history replaces the old alerts center.
- **Streak repair** - (no UI label) - favorable re-evaluation of a liquidated Day when its records sync within 48 h of its Liquidation.

## Sync

- **Sync operation** - "Pendiente" / "Sincronizado" - a queued local write of one entity, waiting for the server's result.
- **Rejected operation** - "No sincronizado" - a Sync operation the server refused, kept with its reason until the user dismisses it.
- **Tombstone** - (no UI label) - a deleted row kept with `deleted_at` so the delete reaches every device; it beats any later edit.
- **Row version** - (no UI label) - the server's count of accepted writes to one row.
- **Change sequence** - (no UI label) - a per-user, ever-increasing number the server stamps on every accepted change; pull order follows it.
- **Sync cursor** - (no UI label) - the last Change sequence a device has pulled for one user.

## Notifications

- **Notification** - push types "Racha en riesgo", "Presupuesto al 80% / 100%", "Parte de batalla" - server-generated messages sent to the user's devices; each type can be turned off.

## Synonyms resolved

- Castle is "Castillo" in the UI; avoid "Fortaleza", "fortress" and "reino" (the repo name is historical).
- "Oro" means Gold only; the old label "Monto de Oro" for a Transaction amount is retired in favor of "Monto".
- Budget plan vs Category limit: "Presupuesto" is the whole plan, "Límite" one Category's cap. Avoid "presupuesto por categoría".
- Active day, not "día con gasto": income and Check-ins count too.
- Battle report, not "alerta": the alerts center and the `alerts` route are retired.
- Transaction `description` (old client) is `note` in v1 on client and server.
- Change sequence and Sync cursor replace "last sync timestamp"; no device timestamp orders anything.
- JAA is the app name everywhere user-facing.

## Known gaps

The running code predates v1 and is replaced per feature (ADR 0007). Until then:

- Money is `REAL` locally and `numeric(10,2)` on the server; amounts are floats with no currency formatting. Resolved by ADR 0005.
- Transaction dates are ISO timestamps (local noon) and Period bounds mix local and UTC. Resolved by ADR 0005.
- Budgets are per Category only, online-only, with no Monthly budget. Resolved by the v1 Budget plan.
- The UI says "Fortaleza", "Batalla", "Botín de Guerra", "Monto de Oro" and "Centro de alertas".
