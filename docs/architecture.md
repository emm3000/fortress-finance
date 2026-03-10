# System Architecture

## Overview

The project is split into two bounded contexts:

- **Frontend (Expo React Native):** Offline-first mobile experience, local persistence, and sync orchestration.
- **Backend (Express + Prisma + PostgreSQL):** Authoritative source of truth, business rules, and secure API boundaries.

## Frontend Architecture

### Layers

1. **Screens (`frontend/app`)**
- Presentation and user interactions.
- No direct database/network implementation details.

2. **Hooks (`frontend/hooks`)**
- UI-facing orchestration (`useSync`, `useBudgets`, `useTransactions`, etc.).
- Query invalidation and flow coordination.

3. **Services (`frontend/services`)**
- API client and remote operations.
- Notification, auth, sync, and monitoring integration points.

4. **Repositories (`frontend/db`)**
- SQLite access layer.
- Local-first writes and queue persistence.

5. **Stores (`frontend/store`)**
- Global app state (authentication and connectivity).

### Offline-First Model

- Transactions are written locally first.
- Pending changes are pushed via sync queue.
- Pull phase updates local state with server changes.
- Reconnect triggers automatic sync retries.

## Backend Architecture

### Request Flow

`routes -> controllers -> services -> repositories -> prisma -> PostgreSQL`

### Responsibilities

- **Routes:** Endpoint declarations and middleware wiring.
- **Controllers:** HTTP orchestration only.
- **Services:** Business logic and use-case rules.
- **Repositories:** Database access abstraction.
- **Middlewares:** Auth, validation, errors, security controls.

### Security and Consistency Controls

- JWT authentication + user existence validation.
- Stale session rejection after credential changes.
- Resource ownership checks for sync and mutation paths.
- Rate limiting for sensitive/expensive endpoints.
- Centralized error envelopes and monitoring hooks.

## Data Synchronization Contract

### Push

Client sends pending local operations (`transactions`, and related entities where enabled).

### Pull

Server returns changes since `lastSyncTimestamp`.

### Conflict and Integrity Rules

- Ownership validation prevents cross-user overwrites.
- Soft-delete semantics preserve delete propagation across offline clients.
- Database constraints and transactional updates preserve consistency.

## Observability

- Backend: Sentry integration + readiness endpoint.
- Frontend: Global error boundary + Sentry initialization support.

## Deployment Baseline

- Backend optimized for Render/Railway style deployment.
- Frontend optimized for EAS build/deploy flows.
- Environment variables are mandatory for production safety.
