# PRD Frontend: Finanzas Personales - Defensa de la Fortaleza
**Stack Tecnológico:** React Native, Expo, TypeScript, SQLite, WatermelonDB/Local-First lib.

---

## Fase 1: El Cimiento (MVP Core)
### 1. Objetivo de la Fase
- **Usuario:** Crear una cuenta y registrar transacciones diarias (ingresos y gastos) asignándolos a categorías básicas sin necesidad de conexión a internet.
- **Técnico:** Cimentar la arquitectura base de la app, configurar la persistencia local en SQLite y estructurar la lógica bidireccional de sincronización (Sync) con el backend.

### 2. Historias de Usuario / Flujos Principales
- **Auth:** Como usuario, quiero registrarme o iniciar sesión de manera segura.
- **Dashboard Core:** Quiero visualizar mi balance, gastos e ingresos diarios de un vistazo.
- **Transacciones Offline:** Quiero poder añadir o editar un gasto al instante en la calle, independientemente de mi conexión móvil.
- **Categorías:** Quiero poder asignar mis tickets de compra a una categoría preestablecida ("Comida", "Transporte").

### 3. Modelo de Datos Relacional Frontend (SQLite)
*Solo aplica lectura/escritura optimista local. Los IDs deben ser UUIDs v4 autogenerados en cliente.*
- `Users`: id (UUID), email (String), name (String), created_at (Date).
- `Categories`: id (UUID), name (String), type (Enum: INCOME/EXPENSE), icon (String).
- `Transactions`: id (UUID), user_id (UUID), amount (Float), type (Enum: INCOME/EXPENSE), category_id (UUID), date (Date), notes (String), sync_status (Enum: PENDING/SYNCED), updated_at (Date).

### 4. Lógica Offline-First y Sincronización
- **Escritura y UI Optimista:** Cada gasto se persiste en SQLite instantáneamente y su `sync_status` es marcado como `PENDING`. La UI se actualiza reactivamente desde SQLite.
- **Ping de Sincronización:** Cada vez que el OS detecta red o al abrir el app, un servicio en background (Worker) toma las filas en `PENDING` y hace un PUSH al backend. Al recibir "OK", cambia localmente a `SYNCED`.

### 5. Reto Técnico Principal
- **Manejo del Estado Reactivo Local-First:** Asegurar que la UI no se trabe (UI unblocking) al escribir en base de datos. Usar librerías maduras como WatermelonDB o PowerSync donde el componente está "suscrito" al query de la base de datos local y se refresca solo, abstrayéndote de la lógica manual de "fetch" REST.

---

## Fase 2: El Motor del Juego (Gamificación Base)
### 1. Objetivo de la Fase
- **Usuario:** Introducir la "Fortaleza". El usuario ve su castillo y los visuales de nivel/HP. Si excede su presupuesto, ve daños visuales.
- **Técnico:** Sincronizar entidades de sólo lectura del servidor hacia el cliente (el estado del castillo se calcula en la nube) y un motor de animaciones de UI eficiente.

### 2. Historias de Usuario / Flujos Principales
- **El Castillo:** Quiero ver la de salud e integridad (HP) de la muralla principal.
- **Presupuestos:** Quiero configurar límites de gasto mensuales por categoría.
- **Feedback Visual (Ataques):** Si pongo un gasto que rompe el presupuesto, quiero ver la animación de un impacto de Orco en el castillo.

### 3. Modelo de Datos Relacional Frontend (SQLite)
- `Budgets`: id (UUID), user_id (UUID), category_id (UUID), limit_amount (Float), sync_status (Enum).
- `Castle_States` *(Solo de Lectura/Sincronización PULL)*: user_id (UUID), level (Int), hp (Int), max_hp (Int), status (Enum: HEALTHY, UNDER_ATTACK, RUINS), last_calculated_at (Date).

### 4. Lógica Offline-First y Sincronización
- Los `Budgets` (presupuestos) se dictan en local (PUSH al backend). 
- El `Castle_State` es netamente del Backend para evitar hacer trampa en local. En cada "Sync PULL", el app pide la nueva salud del castillo e impacta SQLite para representarlo visualmente.

### 5. Reto Técnico Principal
- **Animaciones fluidas (60fps):** Orquestar animaciones con `react-native-reanimated` y Lottie para reaccionar asíncronamente a los cambios de base de datos cuando el castillo baja de HP (ej. cambiar entre estado de "Castillo Lindo" a "Castillo en Llamas" con un estallido de polvo) sin afectar la performance.

---

## Fase 3: Economía y Recompensas
### 1. Objetivo de la Fase
- **Usuario:** Ganar Oro por mantener las rachas de presupuesto, y gastarlo equipando mejoras visuales para el castillo (Pieles, Torreones mágicos).
- **Técnico:** Consumir el "motor de compras virtual" mediante confirmaciones fuertes del backend antes de poder otorgar o dibujar un ítem cosmético.

### 2. Historias de Usuario / Flujos Principales
- **Bóveda de Oro:** Quiero ver cuánto dinero de juego he recolectado gracias a mi racha actual.
- **Tienda:** Quiero navegar por un catálogo offline de accesorios.
- **Customización:** Quiero comprar un Torreón e instalarlo visualmente en la misma pantalla de mi castillo.

### 3. Modelo de Datos Relacional Frontend (SQLite)
- `User_Wallet` *(Pull de Server)*: user_id (UUID), gold_balance (Int), streak_days (Int).
- `Shop_Items`: id (UUID), name (String), price (Int), asset_url (String), type (String: WALL, TOWER).
- `User_Inventory`: id (UUID), item_id (UUID), is_equipped (Boolean), sync_status (Enum).

### 4. Lógica Offline-First y Sincronización
- **Catálogo Offline:** Sincronización (PULL) del catálogo pre-renderizado `Shop_Items`.
- **Intención de Compra (Rollback Optimista):** El usuario compra, se resta oro localmente y se usa el ítem. Pero la transacción va por PUSH al server. Si el server rechaza por fraude/desincronización, el cliente realiza un Rollback (se regresa el oro localmente y se desequipa visualmente con una alerta).

### 5. Reto Técnico Principal
- **Composición Dinámica de Assets (Performance):** Descarga dinámica, caché (`expo-image`) y superposición multicapa (Z-Index absoluto) de las distintas partes del castillo (base + torres + skins) generadas a partir de combinaciones infinitas del inventario activo del usuario.

---

## Fase 4: Notificaciones y Retención
### 1. Objetivo de la Fase
- **Usuario:** Mantenerse en alerta para cuidar su Fortaleza a través de recordatorios transaccionales o de retención ("Llevas 3 días sin patrullar tus gastos").
- **Técnico:** Enlace con un proveedor de Push Notifications y manejo de Deep-Linking en la arquitectura offline local.

### 2. Historias de Usuario / Flujos Principales
- **Alerta de Invasión:** Quiero recibir alerta Push si un gasto me va a dejar en ceros o por encima de lo estipulado.
- **Alerta Local:** Si no abro la app en 3 días, me avisa mediante alerta local (sin internet) que los orcos acechan.

### 3. Modelo de Datos Relacional Frontend (SQLite)
- `Notification_Settings`: user_id (UUID), push_token (String), local_reminders_enabled (Boolean).

### 4. Lógica Offline-First y Sincronización
- Sincroniza el Push Token (FCM/Expo) hacia la nube en el background PUSH.
- El OS de manera nativa (vía Expo - Notifee) se encarga de calendarizar alarmas offline que se resetean cada vez que el usuario abre con la app (Ej: `cancelAll()`, luego `scheduleNext(3 dias)`).

### 5. Reto Técnico Principal
- **Deep-linking desde Notificaciones:** Al tocar un push ("Ataque en sector Comida"), el cliente debe levantarse, evaluar su estado de autenticación de React-Navigation, inicializar la conexión local a su base de datos, y enrutar fluidamente pasándole params a la pantalla de métricas de Comida, previniendo pantallas en blanco.
