# Analisis de migracion del backend a Supabase

## Objetivo

Definir una ruta realista para reemplazar el backend actual `Express + Prisma + PostgreSQL`
por una arquitectura basada en Supabase, minimizando la carga operativa y eliminando la
dependencia de un servidor Node permanente en Render.

La decision de base es:

- usar Supabase Postgres como base de datos principal
- usar Supabase Auth para autenticacion
- usar RLS para aislamiento de datos por usuario
- usar SQL RPC para operaciones compuestas y atomicas
- usar Edge Functions solo cuando haya logica server-side o integraciones externas

## Estado actual del proyecto

El repo actual esta organizado en raiz para el cliente movil:

- `app/`, `hooks/`, `services/`, `db/`, `store/`: Expo + React Native, con modelo offline-first y SQLite local
- `supabase/migrations/`: SQL de esquema, RLS y RPC

Contexto historico:
- existia un backend Express + Prisma + PostgreSQL, usado como base de migracion

Hoy el frontend depende del backend para estas capacidades:

- autenticacion por email/password
- reset de contrasena
- sincronizacion offline-first via `/api/sync`
- categorias remotas
- presupuestos
- dashboard mensual
- onboarding y preferencias
- registro y lectura de notificaciones
- estado del castillo/wallet para la home

Tambien existe logica que no es simple CRUD:

- cron diario en `backend/src/config/cron.ts`
- motor de juego/liquidacion en `backend/src/services/gameEngine.service.ts`
- envio de push notifications via Expo
- dedupe de notificaciones
- ownership checks y reglas de concurrencia en sync

## Hallazgos clave del backend actual

### 1. El frontend ya esta preparado para una migracion por capas

El cliente no habla directo con pantallas o componentes; usa servicios como:

- `services/auth.service.ts`
- `services/sync.service.ts`
- `services/budget.service.ts`
- `services/dashboard.service.ts`
- `services/onboarding.service.ts`
- `services/notification.service.ts`

Eso permite reemplazar la implementacion remota sin reescribir toda la UI.

### 2. La pieza critica no es auth, es sync

El flujo mas delicado esta en `services/sync.service.ts` y en el backend historico:

- `backend/src/services/sync.service.ts`
- `backend/src/services/sync/sync.push.ts`
- `backend/src/services/sync/sync.pull.ts`

Ese contrato hace todo esto:

- push de operaciones pendientes desde SQLite local
- pull de cambios desde la ultima sincronizacion
- reconciliacion por `updatedAt`
- propagacion de `deletedAt`
- verificacion de ownership por usuario
- respuesta compuesta con `transactions`, `budgets`, `castle` y `wallet`

Esto no conviene repartirlo en multiples lecturas/escrituras simples contra PostgREST.
Conviene mantenerlo como una operacion compuesta y atomica.

### 3. El backend actual tiene trabajo tipo worker, no solo API

El cron diario y la liquidacion global son una mala combinacion para una instancia
pequena en Render, especialmente cuando el proceso hace:

- barrido de usuarios
- transacciones en base de datos
- envios de push
- deduplicacion y logging

Ese tipo de carga:

- complica despliegue y observabilidad
- aumenta riesgo de congelamientos o degradacion
- mezcla API online con tareas programadas
- obliga a mantener infraestructura de proceso continuo

### 4. Hay una buena base de comportamiento ya especificado

El backend actual tiene tests que cubren auth, sync, dashboard, onboarding, budgets,
notifications y seguridad. Esto sirve como criterio funcional para la migracion, aunque
la implementacion cambie por completo.

## Por que Render es una mala base para este backend

No es un problema de que Render sea "malo" en abstracto, sino de ajuste arquitectonico.
El backend actual tiene un perfil que castiga un despliegue PaaS simple:

- mezcla API online con cron jobs y trabajo batch
- concentra demasiada logica transaccional en un solo servicio Node
- depende de disponibilidad continua del proceso para tareas programadas
- requiere tuning operativo para algo que Supabase resuelve mejor con Postgres gestionado,
  Auth nativo y funciones puntuales

Para este proyecto, el costo de seguir estabilizando el backend propio es mayor que el
beneficio de mantenerlo.

## Que se migra directo a Supabase

Estas piezas son buenas candidatas para ir directo a Supabase, sin servidor Express:

### Auth

- registro con email/password
- login con email/password
- logout
- reset de contrasena
- sesion persistida en Expo

Se reemplaza el JWT propio por Supabase Auth.

### Datos y CRUD simple

- `categories`
- `budgets`
- `user_preferences`
- `profiles`
- `notification_logs`
- `user_push_tokens`
- `castle_states`
- `user_wallets`
- `transactions`

Estas tablas deben vivir en Supabase Postgres con politicas RLS.

### Operaciones SQL/RPC

Estas no deben quedar como CRUD plano:

- `sync_client_state(...)`
- `get_monthly_dashboard(...)`
- `complete_onboarding(...)`

La razon es que encapsulan reglas de negocio y consistencia que hoy dependen del backend.

## Que queda para Edge Functions

Edge Functions deben usarse solo donde realmente agregan valor:

### Fase 1

- ninguna pieza critica del flujo principal necesita Edge Functions para salir a produccion

### Fase 2

- envio de Expo push notifications
- tareas programadas para liquidacion diaria
- logica que llame a terceros
- procesos que no conviene meter dentro de una funcion SQL

## Decision de arquitectura recomendada

La arquitectura objetivo recomendada es:

- frontend Expo + SQLite local + React Query
- Supabase Auth para sesiones y recuperacion de contrasena
- Supabase Postgres como fuente remota de verdad
- RLS para seguridad multiusuario
- SQL functions / RPC para sync, dashboard y onboarding
- Edge Functions solo para notificaciones y jobs

Esta combinacion reduce infraestructura sin destruir el comportamiento offline-first.

## Decisiones tomadas para la v1

### Decisiones funcionales

- no hay usuarios ni datos reales; el corte puede ser greenfield
- se mantiene el flujo offline-first actual
- se mantiene login por email/password
- la primera salida a produccion prioriza el nucleo financiero

### Alcance de v1

Incluye:

- auth
- onboarding
- categorias
- presupuestos
- dashboard mensual
- sync de transacciones
- estado base de castillo y wallet en home

No incluye:

- liquidacion diaria automatica
- push automaticos
- shop
- inventory
- economia extendida

## Fase 2

La fase 2 reintroduce la parte gamificada y automatizada:

- cron diario o scheduler para liquidacion
- envio de notificaciones push
- dedupe de notificaciones
- recuperacion de `shop/inventory/economy` si vuelven a ser prioridad

## Riesgos y limites

### Riesgo 1. Querer migrar todo como CRUD simple

Si se convierte el sync actual en varias llamadas sueltas a tablas, se pierde:

- atomicidad
- ownership coherente
- reconciliacion por timestamp
- shape de respuesta que hoy consume la app

Mitigacion:

- mantener sync como RPC unico

### Riesgo 2. Querer meter toda la logica en Edge Functions

Eso recrearia otra capa tipo backend custom, solo que encima de Supabase.

Mitigacion:

- usar SQL/RPC para reglas de datos cercanas a Postgres
- reservar Edge Functions para integraciones, cron y efectos externos

### Riesgo 3. Mezclar v1 con gamificacion completa

La home usa castillo y wallet, pero la app principal no necesita que la liquidacion diaria
este lista para empezar a funcionar.

Mitigacion:

- conservar estado base de castillo/wallet en v1
- mover automatizacion de juego a fase 2

### Riesgo 4. Cambiar demasiadas capas a la vez

Si auth, sync, dashboard y gamificacion se cambian juntos sin backlog atomico, el riesgo
de regresiones sube mucho.

Mitigacion:

- trabajar por historias pequenas y commits atomicos

## Estrategia recomendada

La estrategia correcta para este proyecto es:

1. apagar la idea de "migrar el backend actual a Render"
2. adoptar Supabase como backend principal
3. rehacer el borde remoto del frontend sin tocar el modelo offline-first local
4. llevar la logica critica a SQL RPC
5. posponer automatizaciones complejas a una segunda fase

## Conclusiones

- Migrar a Supabase es viable y recomendable.
- No vale la pena mantener el backend Express como pieza central.
- El mayor punto tecnico a cuidar es `sync`, no `auth`.
- La salida mas rapida y segura es una v1 enfocada en finanzas y autenticacion.
- La gamificacion automatizada debe volver en una fase 2 separada.

## Referencias oficiales

- Supabase con Expo: https://supabase.com/docs/guides/with-expo
- Supabase Auth: https://supabase.com/docs/guides/auth
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Edge Functions: https://supabase.com/docs/guides/functions
- Cron y scheduling: https://supabase.com/docs/guides/cron
