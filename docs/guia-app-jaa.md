# JAA: Guia de Producto, Features y Engine

Documento basado en el estado actual del repositorio al 11 de marzo de 2026.

## 1. Que es JAA

JAA es una app mobile-first de finanzas personales que convierte el control del dinero en una experiencia mas clara, mas constante y mas motivadora. En lugar de presentar solo tablas y numeros, la app traduce la salud financiera del usuario en una fortaleza: si el usuario mantiene el control, su reino se mantiene sano; si descuida sus movimientos, la fortaleza entra en riesgo.

La propuesta del producto es simple:

- registrar ingresos y gastos en segundos
- mantener visibilidad mensual real
- controlar presupuestos por categoria
- seguir funcionando aun cuando no haya internet
- devolver feedback util con una capa visual y narrativa mas memorable

En una frase: **JAA convierte la administracion financiera cotidiana en una experiencia de control, progreso y defensa personal**.

## 2. Que problema resuelve

Muchas apps de finanzas fallan en uno de estos puntos:

- son frias y poco motivadoras
- dependen demasiado de la conexion
- muestran datos, pero no priorizan accion
- no generan continuidad de uso

JAA responde a eso con tres decisiones de producto:

1. **Gamificacion con sentido**
La salud financiera se expresa como una fortaleza con HP, oro y racha.

2. **Operacion offline-first**
El usuario puede seguir registrando movimientos aunque no tenga red.

3. **Feedback accionable**
La app no solo guarda datos: tambien resume el mes, marca categorias en riesgo y envia alertas.

## 3. Experiencia para el usuario

La app esta construida alrededor de un flujo muy directo:

1. El usuario descubre la propuesta en onboarding.
2. Crea cuenta o inicia sesion.
3. Entra a un dashboard que resume su estado financiero como una fortaleza.
4. Registra ingresos y gastos rapidamente.
5. Consulta historial y edita o elimina movimientos.
6. Define presupuestos mensuales por categoria.
7. Recibe alertas cuando algo necesita atencion.
8. Si estuvo offline, la app sincroniza sola cuando vuelve la conexion.

## 4. Features principales

### 4.1 Onboarding y acceso

JAA incluye un flujo de entrada completo:

- onboarding inicial con propuesta de valor
- registro con email, nombre y contrasena
- login
- recuperacion de contrasena
- reset de contrasena con codigo temporal

Durante onboarding la app guarda un borrador inicial de preferencias, como moneda y meta de ingreso mensual. Cuando el usuario termina de autenticarse, esas preferencias se sincronizan con el backend para completar su configuracion inicial.

### 4.2 Dashboard principal

El dashboard es el centro del producto. No es solo una home: es el lugar donde el usuario entiende rapidamente como va su mes.

Muestra:

- estado de la fortaleza
- HP actual y maximo
- oro acumulado
- racha activa
- resumen mensual de ingresos, gastos y balance
- top categorias de gasto
- acceso rapido a alertas, presupuestos, historial y nueva transaccion
- estado de sincronizacion si hay operaciones pendientes o fallidas

La lectura del dashboard esta pensada para responder tres preguntas en segundos:

- como estoy hoy
- en que se me esta yendo el dinero
- si necesito actuar ahora

### 4.3 Registro de transacciones

La app permite registrar dos tipos de movimientos:

- `INCOME`
- `EXPENSE`

Cada transaccion incluye:

- monto
- categoria
- fecha
- descripcion opcional

Tambien permite:

- editar una transaccion existente
- eliminarla de forma segura con soft delete
- guardarla localmente aunque el dispositivo este sin internet

Esta parte es clave en la propuesta de valor porque reduce friccion: el usuario no depende de estar online para registrar un gasto real en el momento en que ocurre.

### 4.4 Historial

La vista de historial funciona como un libro de movimientos:

- lista paginada de transacciones
- refresco manual con sincronizacion
- indicadores visuales para distinguir ingresos y gastos
- badge de estado local o sincronizado
- acciones rapidas para editar o eliminar

No es un listado pasivo. Es una pantalla de mantenimiento y correccion del dato financiero personal.

### 4.5 Presupuestos por categoria

La app permite crear y actualizar presupuestos mensuales por categoria de gasto.

Incluye:

- seleccion de categorias de gasto
- configuracion del limite mensual
- lectura del gasto actual contra el limite
- estados visuales de avance: normal, riesgo y excedido

Esto convierte a JAA en una herramienta de prevencion, no solo de registro historico.

### 4.6 Centro de alertas

La app cuenta con un centro de alertas donde el usuario puede ver:

- alertas de ataque o riesgo
- recompensas
- mensajes relacionados con presupuestos

Cuando una alerta esta relacionada con presupuesto, la navegacion lleva al usuario directamente a la pantalla relevante. Eso hace que la alerta no sea solo informativa, sino accionable.

### 4.7 Notificaciones push

JAA registra el push token del dispositivo y lo conecta con el usuario autenticado. Esto le permite enviar avisos reales al telefono cuando sucede algo importante en la logica del producto.

Hoy esta pensado especialmente para eventos de la mecanica diaria de la fortaleza y para notificaciones derivadas del sistema de control financiero.

## 5. La capa de gamificacion

La app usa lenguaje de juego, pero con un objetivo muy concreto: hacer que el seguimiento financiero sea mas intuitivo y menos abstracto.

Los conceptos principales son:

- **Fortaleza**: representa el estado financiero general
- **HP**: simboliza estabilidad o dano
- **Oro**: representa progreso y recompensa
- **Racha**: refleja constancia
- **Batallas**: forma narrativa de registrar gastos
- **Botin**: forma narrativa de registrar ingresos

Esta capa no reemplaza el dato financiero. Lo vuelve mas facil de entender y mas recordable.

## 6. Como funciona el engine de la app

Esta es la parte tecnica explicada en lenguaje de producto.

### 6.1 El telefono funciona como una base operativa local

JAA guarda informacion clave en una base SQLite dentro del dispositivo:

- transacciones
- categorias
- estado local de la fortaleza
- metadata de sincronizacion
- cola de operaciones pendientes

Eso significa que la app puede abrir, leer y guardar datos incluso sin internet. Para el usuario, la sensacion es simple: la app responde rapido y no se rompe cuando la red falla.

### 6.2 La sincronizacion es local primero, nube despues

El modelo real de JAA es **offline-first**.

Cuando el usuario crea, edita o elimina una transaccion:

1. el cambio se guarda primero en SQLite
2. la operacion entra en una cola local de sync
3. si hay internet, la app intenta enviarla al backend
4. si no hay internet, la operacion queda en espera
5. al recuperar conexion, la app reintenta sola

Esto evita la perdida de movimientos y mantiene una experiencia continua.

### 6.3 La cola de sync protege el dato

La app no depende de un "guardar y rezar". Cada cambio pendiente queda registrado como operacion con:

- tipo de entidad
- tipo de operacion
- payload
- numero de intentos
- siguiente reintento
- ultimo error

Si algo falla, la app aplica reintentos con backoff. En terminos de producto, esto mejora confiabilidad sin obligar al usuario a resolver errores tecnicos manualmente.

### 6.4 Supabase es el backend operativo

Supabase cumple cuatro roles principales:

- autenticacion
- base de datos Postgres
- politicas RLS por usuario
- funciones RPC para procesos compuestos

Esto permite que cada usuario vea solo su informacion y que la app tenga operaciones de alto nivel listas para consumir desde mobile.

### 6.5 El onboarding inicializa al usuario

Cuando se crea una cuenta:

- se crea o actualiza el perfil
- se inicializa la fortaleza
- se crea la billetera del usuario con oro inicial

Luego, cuando se completa onboarding:

- se guardan preferencias como moneda y meta mensual
- se asocian categorias iniciales para arrancar rapido

En otras palabras, el usuario no entra a una app vacia: entra a una experiencia ya preparada para usarse.

### 6.6 El dashboard mensual no se calcula en la pantalla

El resumen del mes se obtiene desde un RPC llamado `get_monthly_dashboard`.

Ese proceso agrega:

- ingresos
- gastos
- balance
- cantidad de transacciones
- top categorias de gasto

Esto hace que la app entregue una lectura consistente y centralizada del periodo mensual, en lugar de recalcular todo de forma dispersa en cada pantalla.

### 6.7 El sync reconciliado une lo local con lo remoto

El RPC `sync_client_state` es el corazon del engine de sincronizacion.

Su trabajo es:

- recibir transacciones pendientes del cliente
- aceptar cambios validos del usuario autenticado
- ignorar versiones viejas si el backend ya tiene una mas reciente
- devolver cambios remotos desde el ultimo sync
- incluir estado actualizado de fortaleza y billetera

Este punto es critico porque convierte a JAA en una app robusta para uso real, no solo en demo.

### 6.8 La fortaleza evoluciona con una mecanica diaria automatizada

El backend incluye una logica diaria de "liquidacion" que procesa el estado del usuario una vez por periodo.

A alto nivel:

- si el usuario mantiene racha, puede recibir recuperacion o recompensa
- si no la mantiene, la fortaleza puede recibir dano
- cada ejecucion se registra en una tabla de eventos idempotente

Eso significa que el sistema evita duplicar efectos para el mismo dia y mantiene trazabilidad de lo ocurrido.

### 6.9 Las notificaciones salen de una cola dedicada

Cuando ocurre un evento de liquidacion diaria:

1. se crea un evento auditable
2. un trigger encola una notificacion
3. un scheduler diario ejecuta el batch
4. una Edge Function despacha pushes via Expo
5. el resultado queda registrado en logs

Para el usuario, esto se traduce en una app que no solo muestra informacion: tambien reacciona y acompana.

## 7. Seguridad y confianza

JAA ya incorpora una base solida de seguridad operativa:

- autenticacion con Supabase Auth
- RLS para aislar datos por usuario
- storage seguro de sesion con `expo-secure-store`
- monitoreo con Sentry cuando esta habilitado
- manejo de errores en UI
- proteccion de ownership durante sync

Desde la perspectiva del producto, esto significa que la app esta pensada para escalar sin sacrificar privacidad basica ni consistencia de datos.

## 8. Stack del producto

El producto actual se apoya en:

- Expo + React Native
- Expo Router
- React Query
- Zustand
- SQLite local
- Supabase Auth + Postgres + RPC
- Expo Notifications
- Sentry

Esta combinacion esta alineada con el tipo de producto que JAA quiere ser: una app movil, rapida, resiliente y conectada a una nube moderna sin perder capacidad local.

## 9. Lo que hace especial a JAA

JAA no compite solo por "tener un tracker de gastos". Su diferenciacion real viene de la suma de estas piezas:

- una narrativa de producto memorable
- una experiencia movil pensada para uso diario
- una arquitectura offline-first
- una relacion directa entre datos, alertas y accion
- una mecanica de progreso que refuerza habito

En terminos de posicionamiento, JAA puede presentarse como:

> **Tu fortaleza financiera personal: registra, protege y mejora tu economia diaria sin depender siempre de internet.**

## 10. Resumen ejecutivo

Si hubiera que vender la app en pocas lineas:

**JAA es una app de finanzas personales gamificada que ayuda a registrar movimientos, controlar presupuestos y entender el mes de un vistazo. Su mayor fortaleza no es solo su interfaz: es su engine offline-first, su sincronizacion robusta y su capacidad de convertir datos financieros en una experiencia clara, activa y motivadora.**

## 11. Estado actual del producto

Segun el codigo y la documentacion operativa revisada, el producto ya cuenta con:

- autenticacion
- onboarding
- dashboard mensual
- registro y edicion de transacciones
- historial
- presupuestos
- alertas
- push notifications
- sync offline-first
- scheduler diario para mecanica de liquidacion
- monitoreo y base operativa en produccion

En otras palabras: **JAA ya se comporta como un producto funcional con logica real de negocio, no solo como una interfaz prototipo**.
