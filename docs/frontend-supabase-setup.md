# Frontend Supabase Setup

## Scope

This document defines the minimum frontend environment required after H1.

## Required variables

Set these variables in `frontend/.env` (or EAS env config):

```bash
EXPO_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

## Optional variables

```bash
EXPO_PUBLIC_SENTRY_DSN=""
```

## Notes

- `EXPO_PUBLIC_API_URL` is no longer required for frontend startup.
- Supabase client bootstrap is in `frontend/services/supabase.client.ts`.
- Auth session persistence wiring is intentionally deferred to H4.
