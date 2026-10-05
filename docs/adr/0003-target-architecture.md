# 0003 - Target architecture: feature folders with hexagonal layering

- Status: Accepted; adoption amended by 0007 (rebuild per feature replaces "incremental when touched")
- Date: 2026-10-05

## Context

Code is grouped by technical layer (`app/`, `hooks/`, `services/`, `db/`, `store/`). Boundaries are leaky today: some hooks read repositories directly, some screens call services directly (auth screens, `app/(main)/_layout.tsx`), services and stores import each other, and file casing is mixed in `db/` and `__tests__/`. Finding everything about one domain concept means visiting every layer.

## Decision

- Target is screaming architecture: feature folders named by domain - `transactions`, `budgets`, `castle`, `sync`, `auth`, `notifications`.
- Inside a feature, hexagonal layering: pure domain logic (no React, Expo or Supabase imports), ports as TypeScript interfaces, adapters for SQLite and Supabase, and React hooks/components as the outer ring.
- Screens in `app/` stay thin route files that compose feature hooks and components.
- ~~Adoption is incremental: the target applies to new code and to code being substantially rewritten. Existing layout stays until it is touched; no big-bang moves.~~ Replaced by 0007: v1 rebuilds each feature into the target and deletes the code it replaces.
- ESLint import boundaries guard the adapters (`expo-sqlite` only in `db/`, `@supabase/supabase-js` only in the Supabase client and auth store).

## Consequences

- Both layouts coexist for a while; each PR moves only what it changes.
- Domain logic becomes testable without mocking Expo or Supabase.
- The inconsistencies above are known debt, not patterns to copy.
- When a feature folder appears, boundary lint rules move with it.
