# Backend Architecture

## Objetivo
Este backend está organizado para priorizar:
- legibilidad
- mantenibilidad
- separación clara de responsabilidades

## Capas
El flujo estándar es:

`routes -> controllers -> services -> repositories -> prisma/db`

Soporte transversal:
- `validations`: esquemas de entrada (Zod)
- `utils`: helpers técnicos y de dominio
- `dto`: contratos de salida de servicios
- `mappers`: adaptación explícita de entidades a DTO

## Responsabilidad por carpeta

### `src/routes`
- Define endpoints y middlewares por ruta.
- No contiene lógica de negocio.

### `src/controllers`
- Orquesta request/response HTTP.
- Extrae `userId`, params y body ya validados.
- Llama servicios y responde con `sendOk` / `sendCreated`.

### `src/services`
- Contiene lógica de negocio.
- No debe tener conocimiento de Express.
- Usa DTO + mappers para contratos de salida claros.

### `src/repositories`
- Encapsula acceso a datos (Prisma).
- Evita duplicación de queries en servicios.

### `src/dto` y `src/mappers`
- `dto`: tipos de salida estables por caso de uso.
- `mappers`: traducción explícita de entidades internas a DTO.

### `src/utils`
- Helpers reutilizables (fechas, paginación, assertions de dominio, respuestas).
- Sin reglas de dominio específicas de un módulo (salvo helpers genéricos).

## Convenciones de respuesta API
- Éxito: `{ "data": ... }`
- Error: `{ "error": { "message": "...", "code"?: "...", "details"?: [...] } }`

No mezclar respuestas planas con envelope.

## Convenciones de errores de dominio
- Usar `errorCatalog` para errores de negocio.
- Reusar assertions de dominio para checks repetidos:
  - `assertExists`
  - `assertOwnedByUser`
  - `assertNotDeleted`

## Reglas de contribución (obligatorias)
1. No agregar lógica de negocio en controllers.
2. Toda query Prisma nueva debe vivir en `repositories`.
3. Toda salida de servicio nueva debe tener DTO explícito.
4. Si hay transformación de shape, crear mapper dedicado.
5. Mantener tests de contrato (`api-contract.test.ts`) actualizados cuando cambie el shape.
6. Cualquier endpoint nuevo debe respetar envelope `data/error`.

## Checklist rápido antes de commit
1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. Verificar que no haya lógica de negocio en route/controller.

