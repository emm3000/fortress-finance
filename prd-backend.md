# PRD Backend: Finanzas Personales - Defensa de la Fortaleza
**Stack Tecnológico:** Node.js Express, TypeScript, PostgresSQL, ORM (Prisma o TypeORM), Redis (opcional en inicio).

---

## Fase 1: El Cimiento (MVP Core)
### 1. Objetivo de la Fase
- **Técnico:** Servidor robusto capaz de sostener una API REST stateless. Base central autoritativa (Source of truth) y ruteador que soluciona los conflictos de sincronización offline generados por los celulares.

### 2. Flujos Principales
- **Autenticación API:** Alta y entrada de usuarios (JWT tokens).
- **Proceso Sync (Push/Pull):** Endpoints especiales (`POST /api/sync`) para que el cliente entregue lotes de data modificada y recoja todo lo cambiado en base desde su último `timestamp`.

### 3. Modelo de Datos Relacional Backend (Postgres)
- **users**: `id` UUID PRIMARY KEY, `email` VARCHAR UNIQUE, `password_hash` VARCHAR, `name` VARCHAR, `created_at` TIMESTAMPTZ, `updated_at` TIMESTAMPTZ.
- **categories**: `id` UUID PK, `name` VARCHAR, `type` VARCHAR, `icon` VARCHAR.
- **transactions**: `id` UUID PK, `user_id` UUID (FK users), `amount` DECIMAL, `type` VARCHAR, `category_id` UUID (FK categories), `date` DATE, `notes` TEXT, `updated_at` TIMESTAMPTZ, `deleted_at` TIMESTAMPTZ (Nullable).

### 4. Lógica Offline-First y Sincronización
- **Conflicto UUID:** Como la App Móvil genera los IDs (UUID V4), el Backend hace un comando de la base de datos `UPSERT` (Insertar y Si el ID choca, Actualizar).
- **"Tombstones" (Soft Deletes):** Para poder decirle a la App que borre un registro viejo en SQLite, en lugar de borrarlo con el server usamos la columna (`deleted_at`). En la llamada del "Sync PULL", el server enviará las filas donde `deleted_at IS NOT NULL` y `updated_at > last_sync_date`.

### 5. Reto Técnico Principal
- **Condición de Carrera en la Sincronización Simultánea:** Si el mismo celular se conecta a dos redes intermitentes y lanza 2 llamadas API de Sincronización muy rápidas. Manejar un Timestamp final y Lock de concurrencia al momento del `UPSERT` para evitar sobrepisar la data.

---

## Fase 2: El Motor del Juego (Gamificación Base)
### 1. Objetivo de la Fase
- **Técnico:** Convertir el backend pasivo en un Motor Computacional reactivo donde las Edge Functions (Cron jobs) corren en batch por la noche penalizando y recomensando HP en los castillos dependiendo de sumarizaciones.

### 2. Flujos Principales
- **Liquidación Diaria:** Un Job nocturno que iterativamente calcula la sumatoria de gastos del día respecto a los `budgets` y sustrae porcentaje al `castle_state` HP si pasa sus límites.

### 3. Modelo de Datos Relacional Backend (Postgres)
- **castle_states**: `user_id` UUID PK, `level` INT, `hp` INT, `max_hp` INT, `status` VARCHAR, `updated_at` TIMESTAMPTZ.
- **budgets**: `id` UUID PK, `user_id` UUID, `category_id` UUID, `limit_amount` DECIMAL, `period` VARCHAR (monthly), `updated_at` TIMESTAMPTZ.
- **game_events_log**: `id` UUID, `user_id` UUID, `event_desc` VARCHAR, `hp_impact` INT, `created_at` TIMESTAMPTZ (Historial de ataques validación y debugging).

### 4. Lógica Offline-First y Sincronización
- El servidor solo envía (`PULL`) las actualizaciones de la tabla `castle_states` y rechaza escrituras directas a la tabla HP desde los apps (reglas de seguridad), evitando trampas por clientes hackeados.

### 5. Reto Técnico Principal
- **El Job Cron de Liquidación:** Procesar todas las sumatorias al vuelo cada noche con miles de usuarios va a colapsar un `SELECT N+1`. Reto técnico reside en escribir un poderoso `SQL Batch Aggregation / Stored Procedure` para hacer el cálculo matemáticamente en bloque y actualizar todo el `castle_states` sin saturar la memoria de Node.js.

---

## Fase 3: Economía y Recompensas
### 1. Objetivo de la Fase
- **Técnico:** Desplegar motor anti-fraude para pagos virtuales y una economía cerrada donde los recursos creados matemáticamente coincidan con lo gastado. Seguridad en la creación de Assets.

### 2. Flujos Principales
- **Acreditación Constante (Rachas):** El Job nocturno de la Fase 2 agrega recompensas transaccionales si no hubo ataques.
- **Motor de Transacciones In-App:** Endpoint de validación estricto de compras cosméticas.

### 3. Modelo de Datos Relacional Backend (Postgres)
- **user_wallets**: `user_id` UUID PK, `gold_balance` INT, `streak_days` INT, `updated_at` TIMESTAMPTZ.
- **shop_items**: `id` UUID PK, `name` VARCHAR, `price` INT, `asset_url` VARCHAR.
- **user_inventory**: `id` UUID PK, `user_id` UUID, `item_id` UUID, `is_equipped` BOOLEAN, `updated_at` TIMESTAMPTZ.

### 4. Lógica Offline-First y Sincronización
- Control centralizado: En PostgreSQL, la validación de inventario se hace vía un `BEGIN ... COMMIT` atómico. Si un App móvil sube por Push que *compró algo pero sus monedas son insuficientes en base*, el backend responde con un error forzando a la app a borrar (Rollback local) la transacción fallida.

### 5. Reto Técnico Principal
- **Atomicidad Transaccional de DB (ACID Properties):** Implementar y asegurar "Aislamiento a Nivel Transaccional" (`TRANSACTION ISOLATION LEVEL READ COMMITTED`). Retened bloqueos de filas (`SELECT FOR UPDATE`) temporalmente para evitar que un usuario envíe dos request a `api/comprar_item` al mismo milisegundo e intente comprar 2 items diferentes teniendo balance solo para 1.

---

## Fase 4: Notificaciones y Retención
### 1. Objetivo de la Fase
- **Técnico:** Integración de Cloud Messaging vía Webhooks. Motor de Despacho (Dispatcher) que reacciona indirectamente a alteraciones abruptas para enviar alertas en vivo.

### 2. Flujos Principales
- **Listener de Riesgos:** Al insertar (Sincronizar) las transacciones asíncronas, observar si rompe su presupuesto individual y encolar el alerta inmediatamente a Expo Push Services o FCM.

### 3. Modelo de Datos Relacional Backend (Postgres)
- **user_push_tokens**: `user_id` UUID PK, `token_string` VARCHAR, `updated_at` TIMESTAMPTZ.
- **notification_logs**: `id` UUID, `user_id` UUID, `type` VARCHAR, `status` VARCHAR (sent/failed).

### 4. Lógica Offline-First y Sincronización
- La tabla requiere estar limpia. Si un token rebota (por ejemplo, el usuario desinstaló la App de su móvil), el Catch en Node.js de Cloud Messaging debe ir y eliminar el `token_string` de la tabla de Postgres para detener envíos basura (Zombie Tokens).

### 5. Reto Técnico Principal
- **Desacoplamiento con Colas (Message Brokers):** Cuando un app hace `api/sync` y sube 30 gastos de golpe porque estuvo sin internet 2 días, hay un altísimo riesgo de hacer disparar 30 notificaciones Push seguidas. Se requiere integrar el evento a un "Debouncer/Message Queue" con BullMQ o Redis, que agrupe las alertas y despache 1 sola Notificación Consolidada: *"Tus finanzas han recibido impactos directos por tus últimos gastos offline"*.
