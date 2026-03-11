# JAA

App mobile-first de finanzas personales con gamificacion, captura offline-first y runtime sobre Supabase.

This repository contains the JAA mobile app: a personal finance experience that combines budgeting, monthly visibility, alerts, and offline-first transaction capture.

## Repository Structure

- `app/`, `components/`, `hooks/`, `services/`, `db/`, `store/`: Expo + React Native app (root-based).
- `supabase/migrations/`: SQL migrations and RPC contracts used by the app.
- `docs/`: Consolidated project documentation.
  - `docs/README.md`: Documentation index (active docs + archive).
  - `docs/operations.md`: Operational runbook and validation queries.
  - `docs/milestone-2026-03-11.md`: Current milestone status.

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

For full documentation navigation, see `docs/README.md`.
