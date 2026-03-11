# JAA - Personal Finance Fortress

This repository contains a mobile-first personal finance app with offline-first transaction handling and a Supabase-backed runtime.

## Repository Structure

- `frontend/`: Expo + React Native client.
- `backend/`: Legacy Express + TypeScript API (kept for reference during migration).
- `docs/architecture.md`: Public architecture overview.

## Core Product Capabilities

- Authentication with Supabase Auth.
- Offline-first transaction capture on mobile (local SQLite + sync queue).
- Supabase RPC sync flow with ownership and conflict protections.
- Budget management and monthly dashboard.
- Push token registration lifecycle (register/unregister) on Supabase tables.
- Monitoring integrations (backend and frontend Sentry support).

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npx expo start
```

## Production Notes

- Frontend now requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Frontend keeps `EXPO_PUBLIC_SENTRY_DSN` as optional.
- Android push requires Firebase/FCM credentials plus EAS push credentials.
- The mobile app runtime no longer depends on `EXPO_PUBLIC_API_URL`.

For architecture details, see `docs/architecture.md`.
