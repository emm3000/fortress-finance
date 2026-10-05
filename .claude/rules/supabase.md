---
paths:
  - "supabase/**"
  - "services/**"
---

# Supabase

Decision record: `docs/adr/0002-supabase-rpc-backend.md`.

- Schema changes go in a new file in `supabase/migrations/` named `<next 12-digit number>_h<milestone>_<snake_slug>.sql`, continuing the existing sequence.
- Treat applied migrations as immutable; fix them forward with a new migration. The one exception is the ADR 0005 clean cut: the v1 baseline replaces the superseded files once. Name it `<next 12-digit number>_v1_baseline.sql` (milestone `v1`); from it on the rule holds again.
- Enable Row Level Security on every new table with owner-only policies (`auth.uid() = user_id`), matching the existing tables.
- Write RPCs as `security invoker`. Use `security definer` only with an explicit `auth.uid()` check inside the function and a pinned `search_path`.
- Restrict batch and service jobs to `service_role` grants.
- When an RPC's arguments or result shape change, update the hand-written types in the calling service in the same change.
- Edge functions in `supabase/functions/` run on Deno: import with `npm:` or URL specifiers and read secrets from `Deno.env`.
- Client code reaches Supabase through `services/`; the client instance lives in `services/supabase.client.ts`.
