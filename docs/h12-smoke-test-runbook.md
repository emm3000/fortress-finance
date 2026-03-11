# H12 Smoke Test Runbook (30-40 min)

Fecha: 2026-03-11  
Objetivo: cerrar los `PENDING` de H12 con evidencia minima verificable.

## Preparacion (5 min)

1. Verifica que el frontend tenga:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Inicia app:
   - `npx expo start`
3. Ten abierto Supabase (SQL editor / table editor) para revisar:
   - `profiles`
   - `castle_states`
   - `user_wallets`
   - `user_preferences`
   - `transactions`
   - `user_push_tokens`
   - `notification_logs`

## Evidencia requerida por prueba

- 1 captura de pantalla de UI (resultado final)
- 1 evidencia de datos (fila en Supabase o estado visible en app)
- Resultado: `PASS` o `FAIL`
- Si falla: error textual y paso exacto donde falla

## Bloque A: Auth (8 min)

1. Signup en simulador:
   - Registrar usuario nuevo.
   - Esperado: entra al flujo autenticado.
2. Logout:
   - Cerrar sesion.
   - Esperado: vuelve a login.
3. Login:
   - Ingresar con mismo usuario.
   - Esperado: acceso correcto.
4. Repetir 1-3 en dispositivo fisico.

Checks DB:
- existe `profiles.id = auth.users.id`

## Bloque B: Onboarding (5 min)

1. Usar usuario nuevo.
2. Completar onboarding.
3. Esperado:
   - preferencias guardadas
   - sin errores de sesion

Checks DB:
- existe fila en `user_preferences`
- existe `castle_states` y `user_wallets` para el usuario

## Bloque C: Sync offline->online (8 min)

1. Con sesion activa, poner dispositivo offline.
2. Crear transaccion.
3. Editar esa transaccion.
4. Eliminar (soft delete) esa transaccion.
5. Volver online y forzar sync (pull-to-refresh o accion de sync).
6. Esperado:
   - cola local se vacia
   - no quedan errores de sync

Checks DB:
- transaccion existe con `deleted_at` no nulo (si aplica)
- no hay duplicados por `id`

## Bloque D: Budgets + Dashboard (7 min)

1. Crear/editar un budget para categoria de gasto.
2. Verificar refresco de dashboard.
3. Ver dashboard con datos.
4. Probar mes sin datos (si la UI lo permite) o usuario limpio.

Esperado:
- guardado correcto
- dashboard conserva shape y no rompe UI

## Bloque E: Home (3 min)

1. Abrir home despues de login.
2. Esperado:
   - castillo renderiza (HP/status)
   - wallet renderiza (gold/streak)
   - sin placeholders rotos

## Bloque F: Alertas y push token (4 min)

1. Abrir pantalla de alertas sin datos.
2. Esperado:
   - estado vacio correcto
   - sin crash
3. Con permisos de push activos:
   - validar registro de token
   - hacer logout y validar unregister

Checks DB:
- insercion/eliminacion en `user_push_tokens`

## Cierre y criterio de salida

H12 se considera cerrado cuando:
- todos los bloques A-F = `PASS`
- existe evidencia minima por bloque
- se actualiza `docs/migration-cutover-checklist.md` con resultados finales

Si hay FAIL critico:
- no cortar a produccion
- registrar issue con reproduccion minima
- fix-forward y repetir bloque afectado
