# JAA - Personal Finance Fortress

This repository contains a mobile-first personal finance app with offline-first transaction handling and a Supabase-backed runtime.

## Repository Structure

- `app/`, `components/`, `hooks/`, `services/`, `db/`, `store/`: Expo + React Native app (root-based).
- `supabase/migrations/`: SQL migrations and RPC contracts used by the app.
- `docs/`: Architecture, migration and cutover documentation.

## Core Product Capabilities

- Authentication with Supabase Auth.
- Offline-first transaction capture on mobile (local SQLite + sync queue).
- Supabase RPC sync flow with ownership and conflict protections.
- Budget management and monthly dashboard.
- Push token registration lifecycle (register/unregister) on Supabase tables.
- Monitoring integrations (backend and frontend Sentry support).

## Local Development

```bash
npm install
npx expo start
```

## Production Notes

- Frontend now requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Frontend keeps `EXPO_PUBLIC_SENTRY_DSN` as optional.
- Android push requires Firebase/FCM credentials plus EAS push credentials.
- The mobile app runtime no longer depends on `EXPO_PUBLIC_API_URL`.

For architecture details, see `docs/architecture.md`.
