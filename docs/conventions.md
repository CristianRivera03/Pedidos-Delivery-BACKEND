# Convenciones

## Lenguaje

- **TypeScript** en `strict` mode.
- Código en **inglés** (clases, variables, mensajes).
- Comentarios y commits en **español** (opcional, mantener consistencia).

## Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Clases | `PascalCase` | `UserController`, `CreateUserUseCase` |
| Interfaces | `PascalCase` (sin prefijo `I`) | `UserRepository`, `HashService` |
| Métodos | `camelCase` | `findById`, `execute` |
| Variables | `camelCase` | `userRepository`, `passwordHash` |
| Constantes | `UPPER_SNAKE_CASE` | `BCRYPT_SALT_ROUNDS` |
| Archivos | `kebab-case` | `user.controller.ts`, `create-user.usecase.ts` |
| Carpetas | `kebab-case` | `value-objects`, `usecases` |
| DB tables | `snake_case` (Prisma `@map`) | `users`, `password_hash` |
| DB columns | `snake_case` | `is_active`, `created_at` |
| Symbols DI | `Symbol.for('ClassName')` | `Symbol.for('UserRepository')` |

## Sufijos estándar

| Sufijo | Significado | Carpeta |
|---|---|---|
| `.entity.ts` | Dominio con identidad | `core/entities/` |
| `.value-object.ts` | Tipo validado inmutable | `core/value-objects/` |
| `.repository.ts` | Interface de persistencia | `core/repositories/` |
| `.service.ts` | Interface de servicio | `core/services/` |
| `.error.ts` | Error de dominio | `core/errors/` |
| `.usecase.ts` | Caso de uso | `application/usecases/` |
| `.dto.ts` | Data Transfer Object | `application/dto/` |
| `.mapper.ts` | Conversor entity↔DTO | `application/mappers/` |
| `.controller.ts` | Manejador HTTP | `interfaces/http/controllers/` |
| `.routes.ts` | Definidor de rutas | `interfaces/http/routes/` |
| `.middleware.ts` | Middleware Express | `interfaces/http/middlewares/` |
| `.validator.ts` | Schemas Zod | `interfaces/http/validators/` |
| `prisma.client.ts` | Cliente Prisma | `infrastructure/database/prisma/` |
| `prisma.repository.ts` | Repo con Prisma | `infrastructure/repositories/` |

## Formato

- **Prettier** con `printWidth: 100`, `singleQuote: true`, `semi: true`.
- **ESLint** con `@typescript-eslint/recommended`.
- Sin comentarios redundantes. Solo cuando agreguen contexto que el código no expresa.
- Una clase por archivo.
- Imports agrupados: externos → internos (`@core/*`, `@application/*`, etc.).

## Inyección de dependencias

- Cada use case es `@injectable()`.
- Dependencias se reciben por constructor con `@inject(SYMBOLS.X)`.
- Nunca instanciar manualmente en use cases. Usar el container.
- Nuevos símbolos en `infrastructure/config/di/symbols.ts`.
- Registro en `infrastructure/config/di/container.ts`.

## Validación

- **Zod** para validación de entrada HTTP.
- Schemas por recurso en `interfaces/http/validators/`.
- Errores de Zod se convierten en `ValidationError` (400).
- `value-objects` hacen su propia validación interna.

## Errores

- Jerarquía: `DomainError` (base) → específicas (`NotFoundError`, `ConflictError`, `ValidationError`).
- Cada error tiene `httpStatus` para mapeo automático.
- `errorMiddleware` los captura y serializa a JSON.
- Nunca propagar errores sin tipar en controllers.

## Respuestas HTTP

Formato uniforme:

```json
{
  "success": true,
  "data": { ... }
}
```

Errores:

```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "User with identifier 'xxx' was not found"
  }
}
```

- `201` → POST creado
- `200` → GET / PATCH exitoso
- `204` → DELETE sin contenido
- `400` → validación
- `404` → no encontrado
- `409` → conflicto (duplicate)
- `500` → error interno

## Logging

- Logger base: `LoggerService` (puerto).
- Implementación: `PinoLoggerService`.
- Inyectar en use cases para información útil.
- Controller no debe loguear (lo hace `pino-http`).

## Orden de imports

```ts
import 'reflect-metadata';                                    // 1. Side-effects
import express, { Request } from 'express';                    // 2. Externos
import { z } from 'zod';

import { User } from '@core/entities/user.entity';           // 3. Aliases internos
import { CreateUserUseCase } from '@application/usecases/...';
import { env } from '@infrastructure/config/env';
```

## Tests (cuando se implementen)

- `unit/`: clases puras (entities, use cases sin infraestructura).
- `integration/`: repositories con DB real (test DB).
- `e2e/`: requests HTTP completos con Supertest.
- Mocks solo en unit. Integration usa DB real.

## Documentación de API (Swagger)

- Cada nuevo endpoint requiere un bloque `@openapi` en JSDoc sobre la ruta.
- Tags: agrupar por recurso (`[Users]`, `[Orders]`).
- Reusar schemas definidos en `swagger.config.ts` con `$ref`.
- No duplicar schemas en cada route, agregar al config global.
- Swagger UI solo se sirve en `NODE_ENV !== 'production'`.

Ejemplo:

```ts
/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Listar órdenes
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/', async (req, res) => ...)
```
