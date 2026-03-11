# Smoke Test Runbook

Documento unico para ejecutar, registrar y cerrar el smoke test manual de una build candidata antes de release.

Duracion estimada:

- 30 a 45 minutos para Android
- 45 a 60 minutos si tambien se valida recovery, push y checks operativos

Estado base esperado:

- `npm run lint` verde
- `npm run typecheck` verde
- `npm test` verde
- build candidata generada con EAS
- package Android mantenido como `com.emm3000.fortressfinance`

## 1. Objetivo

Validar que la app puede:

- arrancar sin crash en build real
- autenticar usuarios reales
- operar transacciones online y offline
- sincronizar al reconectar
- mostrar dashboard y presupuestos aun sin red
- navegar correctamente desde alertas
- registrar push token y soportar la validacion operativa minima

## 2. Alcance

Este runbook cubre:

- release Android
- build `production`
- validacion manual en dispositivo real

Fuera de alcance por ahora:

- release iOS, hasta definir `ios.bundleIdentifier`
- validacion profunda de backend fuera de los checks operativos finales

## 3. Datos de la corrida

Completar antes de empezar:

| Campo | Valor |
| --- | --- |
| Fecha | |
| Responsable | |
| Build / version | |
| Commit SHA | |
| Dispositivo | |
| Android version | |
| Entorno | production |
| Package Android | `com.emm3000.fortressfinance` |
| Email de prueba | |
| Confirmacion email activa | Si / No |
| Sentry activo | Si / No |

## 4. Precondiciones

Antes de empezar:

1. Tener una build candidata instalada en un dispositivo real.
2. Tener acceso a:
   - app instalada
   - correo para signup y recovery
   - consola de Supabase
   - consola de Sentry si se usara
3. Tener disponibles estas variables de entorno en el entorno de build:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `APP_ENV=production`
   - `EXPO_PUBLIC_APP_ENV=production`
4. Confirmar que el package Android activo sigue siendo `com.emm3000.fortressfinance`.
5. Tener claro si la confirmacion por email esta activa o no en Supabase Auth.
6. Confirmar que el repo esta limpio antes de generar la build.

## 5. Evidencia requerida

Por cada bloque del smoke test registrar:

- resultado `PASS` o `FAIL`
- screenshot final o evidencia visible equivalente
- si aplica, evidencia de datos en app o backend
- si falla, error exacto y paso exacto donde fallo

Regla minima:

- un bloque sin evidencia no cuenta como `PASS`

## 6. Secuencia de ejecucion

Ejecutar siempre en este orden.

### Bloque A. Preflight local

Comandos:

```bash
npm run lint
npm run typecheck
npm test
```

Resultado esperado:

- los tres comandos terminan en verde
- no hay cambios inesperados en el repo

Marcar `FAIL` si:

- cualquiera de los comandos falla
- el repo queda en estado inconsistente antes del build

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| `npm run lint` | PASS / FAIL | salida local | |
| `npm run typecheck` | PASS / FAIL | salida local | |
| `npm test` | PASS / FAIL | salida local | |
| repo limpio | PASS / FAIL | `git status` | |

### Bloque B. Instalacion y primer arranque

Pasos:

1. Instalar la build candidata.
2. Abrir la app por primera vez.
3. Verificar splash.
4. Verificar que resuelve hacia onboarding o auth.

Resultado esperado:

- no hay cierre inesperado
- no hay pantalla en blanco
- el flujo inicial muestra una ruta valida

Marcar `FAIL` si:

- hay crash en arranque
- la navegacion inicial no resuelve
- la app queda congelada

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| instalacion correcta | PASS / FAIL | screenshot o nota | |
| primer arranque sin crash | PASS / FAIL | screenshot | |
| flujo inicial correcto | PASS / FAIL | screenshot | |

### Bloque C. Auth

Pasos:

1. Crear una cuenta nueva.
2. Si el proyecto exige confirmacion por email, completar ese paso.
3. Iniciar sesion con la cuenta creada.
4. Cerrar sesion.
5. Volver a iniciar sesion.

Resultado esperado:

- signup completo sin estado ambiguo
- si no hay sesion inmediata, la app muestra instruccion de revisar correo
- login exitoso
- logout devuelve al flujo de auth

Evidencia sugerida:

- captura del mensaje post-registro
- captura de login exitoso
- captura post-logout

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| signup | PASS / FAIL | screenshot | |
| confirmacion email | PASS / FAIL / N/A | screenshot o correo | |
| login | PASS / FAIL | screenshot | |
| logout | PASS / FAIL | screenshot | |
| relogin | PASS / FAIL | screenshot | |

### Bloque D. Recovery

Pasos:

1. Abrir forgot password.
2. Solicitar recovery al correo de prueba.
3. Abrir el link de recovery.
4. Completar reset password.
5. Iniciar sesion con la nueva clave.

Resultado esperado:

- request de recovery sin error
- link o flujo de recuperacion funcional
- nueva clave valida

Marcar `FAIL` si:

- no llega el correo
- el deep link no abre el flujo correcto
- la nueva clave no permite login

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| solicitud recovery | PASS / FAIL | screenshot | |
| correo recibido | PASS / FAIL | screenshot | |
| deep link correcto | PASS / FAIL | screenshot | |
| reset password | PASS / FAIL | screenshot | |
| login con nueva clave | PASS / FAIL | screenshot | |

### Bloque E. Core financiero

Usar datos simples para facilitar verificacion:

- gasto ejemplo: `Comida`, monto `25`
- ingreso ejemplo: `Sueldo`, monto `100`

Pasos:

1. Crear un gasto.
2. Crear un ingreso.
3. Editar una transaccion.
4. Eliminar una transaccion.
5. Revisar historial.

Resultado esperado:

- todas las acciones persisten sin error
- historial refleja altas, cambios y bajas
- no hay duplicados visibles

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| crear gasto | PASS / FAIL | screenshot | |
| crear ingreso | PASS / FAIL | screenshot | |
| editar transaccion | PASS / FAIL | screenshot | |
| eliminar transaccion | PASS / FAIL | screenshot | |
| historial coherente | PASS / FAIL | screenshot | |

### Bloque F. Offline -> Online

Pasos:

1. Poner el dispositivo sin internet.
2. Crear una transaccion offline.
3. Verificar que aparece en historial local.
4. Abrir dashboard offline.
5. Abrir presupuestos offline.
6. Volver a habilitar internet.
7. Esperar auto-sync o dispararlo desde la app.
8. Confirmar que el dato sigue presente tras la sync.

Resultado esperado:

- la transaccion existe localmente sin red
- dashboard y presupuestos siguen renderizando
- al reconectar, la sync corre sin bloquearse
- no aparecen duplicados al finalizar la sync

Marcar `FAIL` si:

- no se puede guardar transaccion offline
- dashboard o presupuestos quedan inutilizables sin red
- la cola no se drena al volver online
- aparece perdida o duplicado visible

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| crear transaccion offline | PASS / FAIL | screenshot | |
| historial local offline | PASS / FAIL | screenshot | |
| dashboard offline | PASS / FAIL | screenshot | |
| presupuestos offline | PASS / FAIL | screenshot | |
| reconexion | PASS / FAIL | screenshot | |
| auto-sync | PASS / FAIL | screenshot o log visible | |
| sin duplicados | PASS / FAIL | screenshot | |

### Bloque G. Presupuestos y dashboard

Pasos:

1. Crear o editar al menos un presupuesto.
2. Revisar progreso por categoria.
3. Revisar resumen mensual.
4. Validar que las cifras se mantienen coherentes tras volver al historial.

Resultado esperado:

- presupuesto guarda correctamente
- progreso visible y coherente con transacciones
- resumen mensual consistente

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| crear o editar presupuesto | PASS / FAIL | screenshot | |
| progreso por categoria | PASS / FAIL | screenshot | |
| resumen mensual | PASS / FAIL | screenshot | |
| coherencia con historial | PASS / FAIL | screenshot | |

### Bloque H. Alertas y push

Pasos:

1. Abrir el Centro de alertas.
2. Verificar estado vacio o lista cargada.
3. Tocar una alerta si existe.
4. Verificar la navegacion resultante.
5. Aceptar permisos push si el flujo lo pide.
6. Validar que se registra un push token.
7. Validar recepcion de al menos una push real si el entorno lo permite.

Resultado esperado:

- alerts abre sin crash
- la navegacion ya no depende del texto del titulo
- el token queda registrado correctamente

Marcar `FAIL` si:

- la pantalla de alerts falla
- la alerta no navega a una ruta valida
- no se registra token cuando los permisos fueron aceptados

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| abrir alerts | PASS / FAIL | screenshot | |
| lista o empty state | PASS / FAIL | screenshot | |
| navegar desde alerta | PASS / FAIL / N/A | screenshot | |
| permisos push | PASS / FAIL / N/A | screenshot | |
| registro de token | PASS / FAIL / N/A | screenshot, log o DB | |
| recepcion push real | PASS / FAIL / N/A | screenshot | |

## 7. Checks operativos posteriores

Si el smoke de app pasa, ejecutar el cierre operativo:

1. Revisar errores recientes en Sentry.
2. Revisar logs o paneles de push si aplica.
3. Ejecutar los checks de [operations.md](/Users/emm/Documents/jaa/docs/operations.md).
4. Confirmar salud de colas, logs y scheduler.

Resultado esperado:

- sin errores criticos nuevos
- sin colas atascadas
- scheduler sano en las ultimas corridas

Registro:

| Item | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| Sentry sin errores criticos nuevos | PASS / FAIL / N/A | screenshot | |
| push/logs sanos | PASS / FAIL / N/A | screenshot o query | |
| checks de operations | PASS / FAIL | query o nota | |
| scheduler sano | PASS / FAIL | log o query | |

## 8. Incidentes durante la corrida

Registrar cualquier hallazgo aqui:

| Severidad | Bloque | Paso | Error exacto | Reproducible | Accion siguiente |
| --- | --- | --- | --- | --- | --- |
| P0/P1/P2 | | | | Si / No | |

Regla de severidad recomendada:

- `P0`: bloquea release por crash, login roto o perdida de datos
- `P1`: feature core rota, sync inestable, recovery roto
- `P2`: inconsistencia visual o funcional no bloqueante

## 9. Criterio de aprobacion

La build puede pasar a decision final de release solo si:

1. `Preflight` esta en verde.
2. `Auth`, `Core financiero` y `Offline -> Online` estan en `PASS`.
3. No hay crash en arranque ni en navegacion principal.
4. Dashboard y presupuestos funcionan tambien sin red.
5. El package Android validado sigue alineado con Firebase.
6. No quedan incidentes `P0` ni `P1` abiertos.

## 10. Criterio de bloqueo

No declarar `GO` si ocurre cualquiera de estos casos:

1. crash en primer arranque
2. login o recovery roto
3. transacciones offline no persisten
4. sync al reconectar produce error, duplicado o perdida visible
5. push permissions aceptados pero token no se registra
6. errores criticos repetibles en dashboard, presupuestos o alerts

## 11. Cierre de la corrida

Completar al final:

| Item | Valor |
| --- | --- |
| Resultado final | GO / NO-GO |
| Bloques en FAIL | |
| Incidentes P0 abiertos | 0 / cantidad |
| Incidentes P1 abiertos | 0 / cantidad |
| Build aprobada para release | Si / No |
| Responsable del cierre | |
| Fecha y hora de cierre | |

Decision final:

- `GO`: todos los bloques criticos en `PASS`, sin `P0` ni `P1`
- `NO-GO`: cualquier bloqueo funcional, crash o inconsistencia critica de sync/auth

## 12. Documentos relacionados

Usar este runbook junto con:

- [release-checklist.md](/Users/emm/Documents/jaa/docs/release-checklist.md)
- [operations.md](/Users/emm/Documents/jaa/docs/operations.md)
