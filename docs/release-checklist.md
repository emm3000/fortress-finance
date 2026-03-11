# Release Checklist

Checklist operativa para declarar la app lista para produccion.

Estado base de esta checklist:

- frontend con `lint`, `typecheck` y smoke tests verdes
- auth, transacciones offline, reconnect sync, dashboard offline y presupuestos offline ya cubiertos
- pendientes centrados en salida real, secretos, branding final y validacion en dispositivo

## 1. Decisiones de release

- [ ] Confirmar el nombre final publico de la app.
- [ ] Confirmar si el `android.package` actual se mantiene o se migra.
- [ ] Confirmar si el Centro de alertas queda online-only en esta version.
- [ ] Confirmar si la confirmacion por email en Supabase estara activa en produccion.

## 2. Secrets y configuracion

### Mobile runtime

- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EXPO_PUBLIC_SENTRY_DSN` si se usara monitoreo en produccion
- [ ] `APP_ENV=production`
- [ ] `EXPO_PUBLIC_APP_ENV=production`

### EAS / build

- [ ] `EXPO_TOKEN`
- [ ] `GOOGLE_SERVICES_JSON_BASE64` para Android si aplica
- [ ] Proyecto EAS correcto en `app.config.ts`

### Backend / scheduler / push

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `EXPO_ACCESS_TOKEN` si se usa Expo push access token

## 3. Preflight tecnico

Ejecutar y dejar evidencia:

```bash
npm run lint
npm run typecheck
npm test
```

Checklist:

- [ ] `lint` verde
- [ ] `typecheck` verde
- [ ] `test` verde
- [ ] repo limpio antes de generar build

## 4. Branding y metadata

- [ ] Verificar `name`, `slug` y `scheme` en `app.config.ts`
- [ ] Verificar icono y splash definitivos
- [ ] Verificar `android.package`
- [ ] Verificar textos visibles en onboarding, auth, dashboard, alerts y README
- [ ] Verificar que no queden referencias visibles a `frontend`

## 5. Build release

### Android

- [ ] Ejecutar build `production`
- [ ] Instalar build real en dispositivo
- [ ] Verificar arranque sin crash

Comando sugerido:

```bash
eas build --platform android --profile production
```

### iOS

- [ ] Ejecutar build `production` si aplica
- [ ] Validar instalacion/TestFlight

Comando sugerido:

```bash
eas build --platform ios --profile production
```

## 6. Smoke manual en dispositivo

Runbook detallado:

- `docs/smoke-test-runbook.md`

### Arranque y sesion

- [ ] Abrir la app por primera vez
- [ ] Ver onboarding
- [ ] Crear cuenta nueva
- [ ] Confirmar email si el flujo lo requiere
- [ ] Iniciar sesion
- [ ] Cerrar sesion

### Recuperacion

- [ ] Solicitar recovery
- [ ] Completar reset password
- [ ] Volver a iniciar sesion con nueva clave

### Transacciones

- [ ] Crear gasto
- [ ] Crear ingreso
- [ ] Editar transaccion
- [ ] Eliminar transaccion
- [ ] Ver reflejo en historial

### Offline

- [ ] Poner el dispositivo sin internet
- [ ] Crear transaccion offline
- [ ] Confirmar que se ve en historial local
- [ ] Abrir dashboard y presupuestos offline
- [ ] Recuperar internet
- [ ] Confirmar auto-sync al reconectar

### Presupuestos y dashboard

- [ ] Crear o editar presupuesto
- [ ] Confirmar progreso por categoria
- [ ] Confirmar resumen mensual coherente

### Alertas y push

- [ ] Abrir Centro de alertas
- [ ] Confirmar navegacion al dashboard desde una alerta
- [ ] Confirmar registro de push token en dispositivo real
- [ ] Confirmar recepcion de al menos una push real

## 7. Observabilidad

- [ ] Confirmar que Sentry recibe eventos del entorno correcto
- [ ] Confirmar tags de entorno
- [ ] Forzar un error controlado y verificar captura

## 8. Scheduler y backend

Basado en `docs/operations.md`.

- [ ] Ejecutar validacion de eventos recientes
- [ ] Ejecutar check de duplicados por `period_key`
- [ ] Revisar salud de `notification_dispatch_queue`
- [ ] Revisar outcomes de `notification_logs`
- [ ] Verificar dos corridas consecutivas sanas del scheduler diario

## 9. Criterio de salida

Solo declarar release lista si:

- [ ] build instalada en dispositivo real sin crash
- [ ] smoke manual completo aprobado
- [ ] push real validado
- [ ] sync offline -> online validado
- [ ] monitoreo validado
- [ ] queries operativas sanas

## 10. Rollback

Antes de lanzar:

- [ ] definir a que build/version vuelves si hay incidente
- [ ] dejar identificada la ultima version estable
- [ ] documentar quien ejecuta rollback y donde
- [ ] tener a mano los secrets y accesos del pipeline
