# Cutover Checklist (Supabase v1)

Fecha de actualizacion: 2026-03-11

Runbook operativo:
- `docs/h12-smoke-test-runbook.md`

## 1. Gate tecnico previo a cutover

- [x] Frontend typecheck en verde.
  Comando: `npx tsc --noEmit`
- [x] Frontend lint en verde.
  Comando: `npm run lint`
- [x] No hay llamadas activas a cliente API legacy (`/api/*`, `api.client`, `axios`) en runtime frontend.
  Comando: `rg -n "apiClient|api\.client|/api/|EXPO_PUBLIC_API_URL|axios" app components constants db hooks services store utils --glob '!package-lock.json'`

## 2. Smoke tests funcionales (manual)

Estado:
- `DONE`: validado y con evidencia
- `PENDING`: pendiente de ejecucion manual
- `BLOCKED`: no se puede correr en este entorno

### Auth

- [x] `DONE` Signup en dispositivo fisico.
- [x] `DONE` Login en dispositivo fisico.
- [x] `DONE` Logout en dispositivo fisico.
- [x] `DONE` Signup/Login/Logout en simulador.

### Onboarding

- [x] `DONE` Usuario nuevo completa onboarding y persiste preferencias.
- [x] `DONE` Reingreso no rompe estado inicial (profile/castle/wallet ya creados).

### Sync offline-first

- [x] `DONE` Crear transaccion offline.
- [x] `DONE` Editar transaccion offline.
- [x] `DONE` Eliminar transaccion offline (soft delete).
- [x] `DONE` Reconectar y confirmar vaciado de cola de sync.
- [x] `DONE` Conflicto por timestamp viejo (cliente pierde).
- [x] `DONE` Empate por timestamp igual (definir comportamiento esperado y validar).

### Budgets + Dashboard

- [x] `DONE` Crear/editar budget para categoria de gasto.
- [x] `DONE` Confirmar invalidacion de dashboard tras guardar budget.
- [x] `DONE` Ver dashboard con datos del mes.
- [x] `DONE` Ver dashboard sin datos del mes (estado vacio correcto).

### Home (castle/wallet)

- [x] `DONE` Home renderiza castle y wallet para usuario nuevo.
- [x] `DONE` Home renderiza estado estable tras sync.

### Notificaciones v1

- [x] `DONE` Alertas abre sin error con lista vacia.
- [x] `DONE` Registro/desregistro de push token en `user_push_tokens`.

## 3. Evidencia automatica registrada en esta iteracion

- `frontend` typecheck: OK
- `frontend` lint: OK
- barrido de endpoints legacy en runtime frontend: OK (sin coincidencias)
- smoke manual A-F: OK (todos los casos en `DONE`)
- validacion de migraciones en Supabase: OK
  - RLS activo en tablas criticas
  - RPCs disponibles: `complete_onboarding`, `get_monthly_dashboard`, `sync_client_state`
  - seed base de categorias: `8` filas

## 4. Plan de cutover

1. Congelar cambios funcionales no relacionados a migracion.
2. Aplicar migraciones SQL pendientes en Supabase del repo `supabase/migrations/`.
3. Validar variables de entorno del frontend (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
4. Ejecutar smoke manual completo (seccion 2) en simulador y al menos un dispositivo real.
5. Habilitar release de frontend.
6. Monitorear errores de auth, sync y dashboard durante ventana inicial.

## 5. Estado final

- Cutover v1 a Supabase completado.
- Frontend sin dependencia activa de backend Express para runtime.
- Checklist de validacion manual y tecnica cerrado.

## 6. Rollback simple

Condicion de rollback:
- fallo critico en auth, sync de transacciones o dashboard que bloquee flujo principal.

Acciones:
1. Detener despliegue del build nuevo.
2. Volver al build movil anterior estable.
3. Mantener tablas y funciones nuevas de Supabase sin borrar datos.
4. Registrar incidente con:
   - version/build afectado
   - flujo roto
   - query/funcion SQL implicada
   - reproduccion minima
5. Abrir fix-forward en rama nueva y repetir smoke completo antes de nuevo release.
