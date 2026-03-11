# Cutover Checklist (Supabase v1)

Fecha de actualizacion: 2026-03-11

Runbook operativo:
- `docs/h12-smoke-test-runbook.md`

## 1. Gate tecnico previo a cutover

- [x] Frontend typecheck en verde.
  Comando: `cd frontend && npx tsc --noEmit`
- [x] Frontend lint en verde.
  Comando: `cd frontend && npm run lint`
- [x] No hay llamadas activas a cliente API legacy (`/api/*`, `api.client`, `axios`) en runtime frontend.
  Comando: `rg -n "apiClient|api\.client|/api/|EXPO_PUBLIC_API_URL|axios" frontend --glob '!package-lock.json'`

## 2. Smoke tests funcionales (manual)

Estado:
- `DONE`: validado y con evidencia
- `PENDING`: pendiente de ejecucion manual
- `BLOCKED`: no se puede correr en este entorno

### Auth

- [ ] `PENDING` Signup en dispositivo fisico.
- [ ] `PENDING` Login en dispositivo fisico.
- [ ] `PENDING` Logout en dispositivo fisico.
- [ ] `PENDING` Signup/Login/Logout en simulador.

### Onboarding

- [ ] `PENDING` Usuario nuevo completa onboarding y persiste preferencias.
- [ ] `PENDING` Reingreso no rompe estado inicial (profile/castle/wallet ya creados).

### Sync offline-first

- [ ] `PENDING` Crear transaccion offline.
- [ ] `PENDING` Editar transaccion offline.
- [ ] `PENDING` Eliminar transaccion offline (soft delete).
- [ ] `PENDING` Reconectar y confirmar vaciado de cola de sync.
- [ ] `PENDING` Conflicto por timestamp viejo (cliente pierde).
- [ ] `PENDING` Empate por timestamp igual (definir comportamiento esperado y validar).

### Budgets + Dashboard

- [ ] `PENDING` Crear/editar budget para categoria de gasto.
- [ ] `PENDING` Confirmar invalidacion de dashboard tras guardar budget.
- [ ] `PENDING` Ver dashboard con datos del mes.
- [ ] `PENDING` Ver dashboard sin datos del mes (estado vacio correcto).

### Home (castle/wallet)

- [ ] `PENDING` Home renderiza castle y wallet para usuario nuevo.
- [ ] `PENDING` Home renderiza estado estable tras sync.

### Notificaciones v1

- [ ] `PENDING` Alertas abre sin error con lista vacia.
- [ ] `PENDING` Registro/desregistro de push token en `user_push_tokens`.

## 3. Evidencia automatica registrada en esta iteracion

- `frontend` typecheck: OK
- `frontend` lint: OK
- barrido de endpoints legacy en runtime frontend: OK (sin coincidencias)

## 4. Plan de cutover

1. Congelar cambios funcionales no relacionados a migracion.
2. Aplicar migraciones SQL pendientes en Supabase del repo `supabase/migrations/`.
3. Validar variables de entorno del frontend (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
4. Ejecutar smoke manual completo (seccion 2) en simulador y al menos un dispositivo real.
5. Habilitar release de frontend.
6. Monitorear errores de auth, sync y dashboard durante ventana inicial.

## 5. Rollback simple

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
