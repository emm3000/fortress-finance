# System Architecture

## Overview

The current repository is frontend-first and root-based:

- **Expo React Native app:** Offline-first mobile experience, local persistence, and sync orchestration.
- **Supabase backend services:** Auth, Postgres tables (RLS), and SQL RPC functions for composed operations.

## Frontend Architecture

### Layers

1. **Screens (`app`)**
- Presentation and user interactions.
- No direct database/network implementation details.

2. **Hooks (`hooks`)**
- UI-facing orchestration (`useSync`, `useBudgets`, `useTransactions`, etc.).
- Query invalidation and flow coordination.

3. **Services (`services`)**
- Supabase remote operations.
- Notification, auth, sync, and monitoring integration points.

4. **Repositories (`db`)**
- SQLite access layer.
- Local-first writes and queue persistence.

5. **Stores (`store`)**
- Global app state (authentication and connectivity).

### Offline-First Model

- Transactions are written locally first.
- Pending changes are pushed via sync queue.
- Pull phase updates local state with server changes.
- Reconnect triggers automatic sync retries.

## Supabase Responsibilities

- **Auth:** signup/login/logout/recovery and session lifecycle.
- **RLS Policies:** ownership and isolation by `auth.uid()`.
- **SQL/RPC:** `complete_onboarding`, `get_monthly_dashboard`, `sync_client_state`.

## Data Synchronization Contract

### Push

Client sends pending local operations (`transactions`, and related entities where enabled).

### Pull

RPC returns changes since `lastSyncTimestamp`.

### Conflict and Integrity Rules

- Ownership validation prevents cross-user overwrites.
- Soft-delete semantics preserve delete propagation across offline clients.
- Database constraints and transactional updates preserve consistency.

## Observability

- Frontend: Global error boundary + Sentry initialization support.

## Deployment Baseline

- App optimized for EAS build/deploy flows.
- Supabase hosts data/auth/RPC backend surface.
- Environment variables are mandatory for production safety.
