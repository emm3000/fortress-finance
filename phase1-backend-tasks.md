# Fase 1 Backend: Tareas, Arquitectura y Stack (MVP Core)

## 🏗 Arquitectura Minimalista y Funcional (Diseño en Capas)

Adoptaremos un patrón clásico, escalable y muy testeable: **Controlador -> Servicio -> Repositorio (u ORM Directo)**.
Al usar Prisma, la capa de "Repositorio" suele abstraerse con los métodos directos del ORM (ej. `prisma.user.findUnique`), lo que hace el código muy limpio si se coloca dentro de la capa de Servicios.

Estructura de directorios sugerida:

```text
src/
├── config/         # Configuración (variables de entorno, instancia de Prisma)
├── controllers/    # Lógica de entrada HTTP (req, res), llaman a los servicios
├── middlewares/    # Auth, manejo de errores, interceptores y validaciones (Zod)
├── routes/         # Definición explícita de endpoints e inyección de controllers
├── services/       # Lógica de negocio (pura, independiente de Express)
├── utils/          # Helpers (generación JWT, encriptación)
├── app.ts          # Setup de la aplicación Express (rutas, middlewares globales)
└── server.ts       # Punto de inicio (listen al puerto e inicialización)
```

## 🛠 Stack Tecnológico y Dependencias

Agregamos herramientas modernas demandadas en la industria para garantizar calidad y experiencia de desarrollo inmejorables.

**Core:**

- `express`: Framework backend minimalista.
- `typescript` / `tsx`: Tipado estático y engine para ejecución rápida en dev.

**Base de Datos:**

- `prisma`: ORM moderno, Tipado seguro e inferencia asombrosa.
- `@prisma/client`: Cliente autogenerado para consultas.

**Seguridad y Validación:**

- `jsonwebtoken`: Emisión y validación de tokens.
- `bcrypt`: Hasheo de claves seguro.
- `zod`: Librería moderna y predominante para validación de schemas de entrada (reemplaza a Joi o class-validator).
- `cors` / `helmet`: Sanitización de HTTP headers y políticas de orígenes.

**Calidad y Tooling (DevDependencies):**

- `eslint` (Flat Config) / `prettier`: Linter y formateador.
- `husky` / `lint-staged`: Agrega pre-commit hooks para impedir subir código mal formateado o que rompa las reglas del linter.
- `vitest`: Framework de testing súper rápido (mismo ecosistema Vite), reemplaza maravillosamente a Jest para TypeScript nativo.
- `supertest`: Ideal para hacer pruebas de QA/e2e contra los endpoints HTTP.
- `morgan`: Logger detallado de peticiones para ambiente dev.

---

## 📋 Lista de Tareas (Checklist Fase 1)

### 1. Inicialización y Configuración del Proyecto (Setup)

- [x] Inicializar proyecto Node.js (`npm init -y`) y configurar `tsconfig.json` con `strict: true`.
- [x] Instalar dependencias core de producción y desarrollo definidas arriba.
- [x] Configurar Express en `src/app.ts` y el puerto en `src/server.ts`.
- [x] Configurar ESLint y Prettier. Asegurarse que están sincronizados (con eslint-config-prettier).
- [x] Configurar Git Hooks con `husky` y `lint-staged` en el `package.json`.
- [x] Configurar `vitest` para las pruebas ejecutando scripts (`npm run test`).

### 2. Base de Datos y Prisma ORM

- [ ] Inicializar Prisma (`npx prisma init`).
- [ ] Definir el Schema en `schema.prisma` basado en el PRD de la Fase 1:
  - Modelo `User`
  - Modelo `Category`
  - Modelo `Transaction` (con lógica de `deleted_at` para el offline-first).
- [ ] Desplegar o configurar instancia PostgreSQL (local o Docker).
- [ ] Correr la primera migración de estructura base (`npx prisma migrate dev`).

### 3. Utilidades y Middlewares Globales

- [ ] Desarrollar `middlewares/errorHandler.ts`: Para atrapar excepciones de Prisma y mandarlas amigablemente con códigos 400/500 al cliente.
- [ ] Crear el middleware genérico para enrutar Zod: `middlewares/validate.ts` (Que valide req.body / req.query / req.params).
- [ ] Crear utils de seguridad: `utils/password.ts` (hash/compare) y `utils/jwt.ts` (sign/verify).

### 4. Dominio: Autenticación de Usuarios (Auth)

- [ ] **Validadores (`validations/auth.validation.ts`):** Schemas de Zod para Registro y Login.
- [ ] **Servicios (`services/auth.service.ts`):**
  - `registerUser(payload)`: valida, hashea, guarda, devuelve usuario.
  - `loginUser(payload)`: comprueba email, machea password y retorna JWT.
- [ ] **Controladores (`controllers/auth.controller.ts`):** Invoca a servicios y maneja codigos de respuesta de Express.
- [ ] **Rutas (`routes/auth.routes.ts`):** `POST /api/auth/register` y `POST /api/auth/login`.

### 5. Middleware de Autenticación Activa

- [ ] Escribir `middlewares/requireAuth.ts`: Lee el Header `Authorization` tipo `Bearer Token`, verifica el JWT de tu variable de entorno secreta, extrae el `userId` y lo inyecta en el objeto Request para que las siguientes rutas sepan quién es el usuario.

### 6. Dominio: Categorías (Setup)

- [ ] **Seed Base de Datos:** Crear un script (`prisma/seed.ts`) que inserte categorías predefinidas estándar ("Sueldo", "Comida", "Transporte").
- [ ] **Ruta de Categorías:** `GET /api/categories` de solo lectura y protegida para que el cliente móvil baje las categorías y cachee localmente.

### 7. Dominio: Sincronización Transaccional (Corazón Offline-First)

- [ ] **Esquemas de Zod:** Diseñar cómo será la forma del PUSH que mandará la App. E.g. una lista de "cambios": `{ transactions: TransactionInputType[] }`.
- [ ] **Servicios de Sincronización (`services/sync.service.ts`):**
  - Implementación PUSH: Iterar (o hacer map a un batch transaccional de prisma) la lista provista en una `Prisma.$transaction`. Hacer **Upsert** usando el UUID que viene de la App cliente.
  - Implementación PULL: Leer en BDD todas las transacciones donde el `user_id` coincida y `updated_at` sea mayor al `lastSyncTime` que manda el cliente desde la app. Incluir las soft-deleted.
- [ ] **Controlador & Rutas:** Exponer el endpoint maestro `POST /api/sync` y envolverlo con `requireAuth` para segurizar el proceso Offline-First.

### 8. Testing Automatizado Base (QA)

- [ ] Test Unitario simple probando `utils/password.ts` y las firmas de criptografía.
- [ ] Test E2E de Flujo Auth (`Vitest` + `Supertest`): Ejecutar HTTP req contra `POST /register`, esperar el 201 y JWT de vuelta. Intentar `POST /login` y assert validation errors 400.
- [ ] (Opcional pero Recomendado) Test E2E de Sync PULL/PUSH que asegure que enviar información no sobreescribe otra erróneamente.
