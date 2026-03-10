# JAA - Personal Finance Fortress

This repository contains a mobile-first personal finance app with offline-first transaction handling and a production-oriented backend.

## Repository Structure

- `frontend/`: Expo + React Native client.
- `backend/`: Express + TypeScript API with PostgreSQL (Prisma).
- `docs/architecture.md`: Public architecture overview.

## Core Product Capabilities

- Authentication with JWT.
- Offline-first transaction capture on mobile (local SQLite + sync queue).
- Server-side sync endpoint with ownership and conflict protections.
- Budget management and monthly dashboard.
- Push token registration lifecycle (register/unregister).
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

- Backend requires environment configuration (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, etc.).
- Frontend requires `EXPO_PUBLIC_API_URL` and optional `EXPO_PUBLIC_SENTRY_DSN`.
- Android push requires Firebase/FCM credentials plus EAS push credentials.

For architecture details, see `docs/architecture.md`.
