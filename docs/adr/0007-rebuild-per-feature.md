# 0007 - Rebuild per feature into the target architecture

- Status: Accepted
- Date: 2026-10-05
- Amends: 0003 (replaces its "Adoption is incremental" decision; the target shape stays)

## Context

ADR 0003 adopted feature folders with hexagonal layering incrementally, only for code being touched. v1 replaces sync, the data model and the game rules (ADRs 0005, 0006) and redesigns every screen, so almost no current module survives unchanged. Moving code piecemeal would keep two layouts and two sync contracts alive for the whole rebuild.

## Decision

- v1 is rebuilt in this repository, feature by feature, directly into the 0003 target: domain feature folders `transactions`, `budgets`, `castle`, `sync`, `auth`, `notifications`, plus `categories`, `onboarding` and `profile` as needed.
- Each feature lands complete (domain, ports, adapters, hooks, components) and the old code it replaces is deleted in the same change or the next one. No adapter bridges old and new modules.
- Order: (1) data + sync v2 foundation, mostly wave-of-one; (2) design system and screen design in parallel, no code (ADR 0008); (3) Liquidation v2 and UI rebuild in waves. Phases and exit criteria: `docs/prd/v1.md`.
- 0003's import boundaries apply to every new feature folder from its first commit.

## Consequences

- Until a feature is rebuilt, its old code still runs and the current invariants in `CLAUDE.md` describe it.
- Tickets name the feature folder they create and the old paths they delete; "Layers as they are today" in `CLAUDE.md` shrinks as features land.
- Screens wait for phase 2 designs; data and sync work does not.
