# Frontend Supabase Setup

## Scope

This document defines the minimum frontend environment required after H1.

## Required variables

Set these variables in `.env` at project root (or EAS env config):

```bash
EXPO_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

## Optional variables

```bash
EXPO_PUBLIC_SENTRY_DSN=""
```

## Notes

- `EXPO_PUBLIC_API_URL` is no longer used by the frontend runtime.
- Supabase client bootstrap is in `services/supabase.client.ts`.
- Auth session persistence is active via Supabase Auth + SecureStore.
