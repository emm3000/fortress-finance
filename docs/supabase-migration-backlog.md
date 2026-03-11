# Backlog de migracion a Supabase

## Objetivo del backlog

Descomponer la migracion del backend actual a Supabase en historias implementables, con
subtareas pequenas, trazables y aptas para commits atomicos.

## Reglas de ejecucion

- una subtarea = un cambio pequeno y revisable
- una subtarea deberia idealmente corresponder a un commit
- no mezclar documentacion, infraestructura y codigo en el mismo commit si no es necesario
- completar una historia solo cuando cumple sus criterios de aceptacion
- no adelantar fase 2 mientras la v1 no este estable

## Convencion de estado

- [ ] pendiente
- [x] completado
- [-] diferido

---

## H1. Bootstrap de Supabase y contrato de configuracion

### Objetivo

Preparar el proyecto para usar Supabase desde el frontend sin romper el flujo de desarrollo.

### Subtareas atomicas

- [x] Instalar `@supabase/supabase-js` en el proyecto (raiz).
  Commit sugerido: `chore(frontend): add supabase sdk`
- [x] Crear cliente compartido de Supabase en el frontend.
  Commit sugerido: `feat(frontend): add shared supabase client`
- [x] Definir nuevas variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
  Commit sugerido: `chore(frontend): add supabase env contract`
- [x] Documentar configuracion local para trabajar con Supabase.
  Commit sugerido: `docs(frontend): add supabase setup notes`
- [x] Verificar que el frontend compile sin depender de `EXPO_PUBLIC_API_URL`.
  Commit sugerido: `refactor(frontend): remove api url requirement`

### Criterios de aceptacion

- el frontend puede inicializar un cliente Supabase valido
- las variables nuevas estan documentadas
- no hay bloqueo de arranque por ausencia de `EXPO_PUBLIC_API_URL`

---

## H2. Esquema base en Supabase

### Objetivo

Crear la base de datos remota que reemplaza las tablas activas de la v1 del backend.

### Subtareas atomicas

- [x] Crear migracion SQL para tabla `profiles`.
  Commit sugerido: `feat(db): add profiles table`
- [x] Crear migracion SQL para tabla `categories`.
  Commit sugerido: `feat(db): add categories table`
- [x] Crear migracion SQL para tabla `transactions`.
  Commit sugerido: `feat(db): add transactions table`
- [x] Crear migracion SQL para tabla `budgets`.
  Commit sugerido: `feat(db): add budgets table`
- [x] Crear migracion SQL para tablas `castle_states` y `user_wallets`.
  Commit sugerido: `feat(db): add castle and wallet tables`
- [x] Crear migracion SQL para tablas `user_preferences` y `user_initial_categories`.
  Commit sugerido: `feat(db): add onboarding tables`
- [x] Crear migracion SQL para tablas `notification_logs` y `user_push_tokens`.
  Commit sugerido: `feat(db): add notification tables`
- [x] Agregar indices para sync, filtros por usuario y dashboard.
  Commit sugerido: `feat(db): add performance indexes`
- [x] Agregar script o seed idempotente de categorias base.
  Commit sugerido: `feat(db): seed default categories`

### Criterios de aceptacion

- la base tiene todas las tablas necesarias para la v1
- existen indices para consultas de sync y dashboard
- la siembra de categorias puede correr sin duplicados

---

## H3. Seguridad con RLS

### Objetivo

Garantizar que cada usuario vea y modifique solo sus propios datos.

### Subtareas atomicas

- [x] Habilitar RLS en `profiles`.
  Commit sugerido: `feat(db): enable rls on profiles`
- [x] Habilitar RLS en `transactions`.
  Commit sugerido: `feat(db): enable rls on transactions`
- [x] Habilitar RLS en `budgets`.
  Commit sugerido: `feat(db): enable rls on budgets`
- [x] Habilitar RLS en `castle_states` y `user_wallets`.
  Commit sugerido: `feat(db): enable rls on game state`
- [x] Habilitar RLS en `user_preferences` y `user_initial_categories`.
  Commit sugerido: `feat(db): enable rls on onboarding tables`
- [x] Habilitar RLS en `notification_logs` y `user_push_tokens`.
  Commit sugerido: `feat(db): enable rls on notification tables`
- [x] Crear politica de solo lectura autenticada para `categories`.
  Commit sugerido: `feat(db): add categories read policy`
- [x] Validar manualmente que un usuario no puede leer datos de otro.
  Commit sugerido: `test(db): validate user isolation`

### Criterios de aceptacion

- todas las tablas de usuario estan protegidas por `auth.uid()`
- `categories` es legible para usuarios autenticados
- no hay acceso cruzado entre usuarios

---

## H4. Auth con Supabase

### Objetivo

Reemplazar el auth propio del backend por Supabase Auth en Expo.

### Subtareas atomicas

- [x] Migrar login a `signInWithPassword`.
  Commit sugerido: `feat(auth): migrate login to supabase`
- [x] Migrar registro a `signUp`.
  Commit sugerido: `feat(auth): migrate signup to supabase`
- [x] Migrar logout a cierre de sesion Supabase.
  Commit sugerido: `refactor(auth): migrate logout flow`
- [x] Adaptar `auth.store` para persistir e hidratar sesion Supabase.
  Commit sugerido: `refactor(auth): persist supabase session`
- [x] Escuchar cambios de auth y actualizar estado global.
  Commit sugerido: `feat(auth): subscribe to session changes`
- [x] Migrar recovery/reset de contrasena con Supabase.
  Commit sugerido: `feat(auth): add supabase password recovery`
- [x] Eliminar manejo manual de bearer token de axios.
  Commit sugerido: `refactor(auth): remove custom token plumbing`

### Criterios de aceptacion

- signup, login y logout funcionan
- la sesion persiste al reiniciar la app
- reset de contrasena no depende del backend Express

---

## H5. Bootstrap de usuario y onboarding

### Objetivo

Crear automaticamente el estado minimo de un usuario nuevo y migrar onboarding.

### Subtareas atomicas

- [x] Crear trigger o funcion para poblar `profiles` al registrar usuario.
  Commit sugerido: `feat(db): bootstrap profile on signup`
- [x] Crear trigger o funcion para poblar `castle_states`.
  Commit sugerido: `feat(db): bootstrap castle state on signup`
- [x] Crear trigger o funcion para poblar `user_wallets`.
  Commit sugerido: `feat(db): bootstrap wallet on signup`
- [x] Implementar RPC `complete_onboarding`.
  Commit sugerido: `feat(db): add onboarding rpc`
- [x] Adaptar `OnboardingService` al RPC nuevo.
  Commit sugerido: `feat(frontend): migrate onboarding service`
- [x] Mantener borrador local y limpieza post-sync.
  Commit sugerido: `refactor(frontend): preserve onboarding draft flow`

### Criterios de aceptacion

- un usuario nuevo tiene perfil, castillo y wallet
- onboarding guarda preferencias correctamente
- las categorias iniciales se asignan una sola vez

---

## H6. Categorias en Supabase

### Objetivo

Sustituir el endpoint de categorias por lectura directa desde Supabase manteniendo cache local.

### Subtareas atomicas

- [x] Crear consulta remota de categorias en el frontend.
  Commit sugerido: `feat(frontend): fetch categories from supabase`
- [x] Adaptar `SyncService.syncCategories` para dejar de llamar `/categories`.
  Commit sugerido: `refactor(sync): migrate categories sync source`
- [x] Mantener persistencia en SQLite via `CategoryRepository`.
  Commit sugerido: `refactor(frontend): keep local category cache`
- [x] Verificar uso en formularios y filtros por tipo.
  Commit sugerido: `test(frontend): validate category consumers`

### Criterios de aceptacion

- categorias llegan desde Supabase
- siguen guardandose localmente
- la UI que depende de categorias no cambia su comportamiento

---

## H7. Budgets en Supabase

### Objetivo

Mover budgets al stack Supabase manteniendo la UX actual online-only.

### Subtareas atomicas

- [x] Migrar lectura de budgets a Supabase.
  Commit sugerido: `feat(frontend): migrate budget reads`
- [x] Migrar upsert de budgets a Supabase.
  Commit sugerido: `feat(frontend): migrate budget writes`
- [x] Mantener invalidacion de React Query para budgets y dashboard.
  Commit sugerido: `refactor(frontend): preserve budget invalidation`
- [x] Verificar restricciones por usuario y unicidad de categoria.
  Commit sugerido: `test(db): validate budget ownership and uniqueness`

### Criterios de aceptacion

- listar y guardar presupuestos funciona
- la app sigue mostrando error si no hay internet al guardar
- no se pueden crear budgets cruzados entre usuarios

---

## H8. Dashboard mensual via RPC

### Objetivo

Mover el dashboard agregado a una funcion SQL/RPC que conserve el contrato actual.

### Subtareas atomicas

- [x] Implementar RPC `get_monthly_dashboard(year, month)`.
  Commit sugerido: `feat(db): add monthly dashboard rpc`
- [x] Mantener el shape actual del resultado del dashboard.
  Commit sugerido: `refactor(db): align dashboard rpc response`
- [x] Migrar `DashboardService` para consumir el RPC.
  Commit sugerido: `feat(frontend): migrate dashboard service`
- [x] Verificar la home con datos y sin datos del mes.
  Commit sugerido: `test(frontend): validate monthly dashboard states`

### Criterios de aceptacion

- el dashboard devuelve ingresos, gastos, balance y top categorias
- la home sigue renderizando estados vacios correctamente

---

## H9. Sync offline-first sobre RPC

### Objetivo

Preservar el modelo offline-first sin backend Express.

### Subtareas atomicas

- [x] Disenar firma del RPC `sync_client_state`.
  Commit sugerido: `feat(sync): define rpc contract`
- [x] Implementar push de transacciones con ownership y `updated_at`.
  Commit sugerido: `feat(db): add transaction push logic`
- [x] Implementar soporte de soft delete por `deleted_at`.
  Commit sugerido: `feat(db): add transaction soft delete sync`
- [x] Implementar pull incremental desde `last_sync_timestamp`.
  Commit sugerido: `feat(db): add incremental sync pull`
- [x] Agregar `castle` y `wallet` al payload de respuesta.
  Commit sugerido: `feat(sync): return castle and wallet payload`
- [x] Migrar `services/sync.service.ts` al RPC nuevo.
  Commit sugerido: `feat(frontend): migrate sync service`
- [x] Mantener cola local y backoff sin cambios de UX.
  Commit sugerido: `refactor(frontend): preserve sync queue behavior`
- [x] Verificar conflicto por timestamp viejo y empate por timestamp igual.
  Commit sugerido: `test(sync): validate timestamp conflict rules`

### Criterios de aceptacion

- crear, editar y borrar transacciones offline sigue funcionando
- al reconectar, la cola se vacia correctamente
- las reglas de ownership y reconciliacion se conservan

---

## H10. Notificaciones basicas de v1

### Objetivo

Mantener la pantalla de alertas funcional sin depender todavia de automatizaciones.

### Subtareas atomicas

- [x] Migrar lectura de `notification_logs` a Supabase.
  Commit sugerido: `feat(frontend): migrate notification reads`
- [x] Migrar registro de `user_push_tokens` si se decide mantener desde v1.
  Commit sugerido: `feat(frontend): migrate push token registration`
- [x] Permitir que la pantalla de alertas funcione vacia sin errores.
  Commit sugerido: `refactor(frontend): harden empty notification states`

### Criterios de aceptacion

- la pantalla de alertas abre y no falla
- si no hay notificaciones, muestra estado vacio correcto

---

## H11. Eliminacion de dependencia del backend Express

### Objetivo

Dejar el frontend funcionando sin llamadas residuales a `/api/*`.

### Subtareas atomicas

- [x] Retirar `services/api.client.ts` del flujo principal.
  Commit sugerido: `refactor(frontend): remove legacy api client`
- [x] Eliminar axios si deja de usarse.
  Commit sugerido: `chore(frontend): remove axios dependency`
- [x] Buscar y remover llamadas residuales a `/api/`.
  Commit sugerido: `refactor(frontend): remove legacy api endpoints`
- [x] Actualizar README y docs de despliegue.
  Commit sugerido: `docs: update deployment model for supabase`

### Criterios de aceptacion

- no quedan llamadas activas a `/api/*`
- el backend Express puede apagarse para la v1

---

## H12. QA de corte

### Objetivo

Tener un checklist de validacion antes de declarar cerrada la migracion de v1.

### Subtareas atomicas

- [x] Validar signup/login/logout en dispositivo y simulador.
  Commit sugerido: `test: add auth migration smoke results`
- [x] Validar onboarding completo de usuario nuevo.
  Commit sugerido: `test: add onboarding smoke results`
- [x] Validar flujo offline -> online de transacciones.
  Commit sugerido: `test: add sync smoke results`
- [x] Validar budgets y dashboard con usuario real de prueba.
  Commit sugerido: `test: add finance smoke results`
- [x] Validar home con castillo/wallet sin fase 2 activa.
  Commit sugerido: `test: add home state smoke results`
- [x] Documentar checklist de corte y rollback simple.
  Commit sugerido: `docs: add migration cutover checklist`

### Criterios de aceptacion

- existe evidencia de validacion de los flujos criticos
- hay checklist de corte
- hay rollback simple documentado

---

## Historias diferidas a fase 2

### H13. Liquidacion diaria y motor de juego

- [-] Implementar scheduler para liquidacion diaria.
  Commit sugerido: `feat(game): add daily liquidation scheduler`
- [-] Portar reglas de dano, curacion, streak y oro.
  Commit sugerido: `feat(game): port liquidation rules`
- [-] Registrar eventos de juego y estados post-liquidacion.
  Commit sugerido: `feat(game): persist liquidation results`

### H14. Push notifications automaticas

- [-] Crear Edge Function para envio de Expo push.
  Commit sugerido: `feat(notifications): add expo push function`
- [-] Agregar dedupe de notificaciones.
  Commit sugerido: `feat(notifications): add dedupe rules`
- [-] Integrar scheduler con eventos de juego.
  Commit sugerido: `feat(notifications): schedule game alerts`

### H15. Economia, shop e inventory

- [-] Migrar `shop_items`.
  Commit sugerido: `feat(economy): add shop items`
- [-] Migrar `user_inventories`.
  Commit sugerido: `feat(economy): add inventory ownership`
- [-] Portar compra/equipamiento y restricciones.
  Commit sugerido: `feat(economy): port purchase and equip flows`

---

## Orden recomendado de ejecucion

1. H1 Bootstrap de Supabase y contrato de configuracion
2. H2 Esquema base en Supabase
3. H3 Seguridad con RLS
4. H4 Auth con Supabase
5. H5 Bootstrap de usuario y onboarding
6. H6 Categorias en Supabase
7. H7 Budgets en Supabase
8. H8 Dashboard mensual via RPC
9. H9 Sync offline-first sobre RPC
10. H10 Notificaciones basicas de v1
11. H11 Eliminacion de dependencia del backend Express
12. H12 QA de corte

## Definicion de v1 completada

La v1 se considera terminada cuando:

- auth funciona solo con Supabase
- categories, budgets, onboarding y dashboard ya no dependen del backend Express
- sync offline-first funciona sobre RPC
- la home sigue siendo usable con castillo y wallet
- el frontend no hace llamadas activas a `/api/*`
- existe checklist de corte documentado
