# Arquitectura

Este proyecto sigue **Clean Architecture** pragmática, optimizada para un backend REST con una sola interfaz (HTTP). No añadimos ceremonia innecesaria (Ports/Presenters por use case) porque no tenemos múltiples "entradas" al mismo caso de uso.

## Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│                          main/                              │
│              (Composition root + bootstrap)                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   interfaces/    │  │ infrastructure/  │  │   application/   │
│   (HTTP layer)   │  │   (Adapters)     │  │   (Use cases)    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │      core/       │
                    │  (Domain rules)  │
                    └──────────────────┘
```

## Las 4 capas

### 1. `core/` — Dominio (Enterprise Business Rules)

**Capa más interna. No depende de nada externo.**

- `entities/`: objetos con identidad (`User`).
- `value-objects/`: tipos validados inmutables (`Email`, `Uuid`).
- `repositories/`: **interfaces** de persistencia (puertos).
- `services/`: **interfaces** de servicios externos (`HashService`, `TokenService`, `LoggerService`).
- `errors/`: jerarquía de errores de dominio (`NotFoundError`, `ConflictError`, etc.).

**Reglas:**
- ❌ No puede importar de `express`, `prisma`, `jsonwebtoken`, etc.
- ❌ No conoce frameworks.
- ✅ Solo depende de `@core/*` y tipos/librerías puras.

### 2. `application/` — Casos de uso (Application Business Rules)

**Orquesta el dominio para resolver un problema concreto.**

- `usecases/<recurso>/`: clases `@injectable` con un método `execute()`.
- `dto/`: contratos de entrada/salida (input del controller, output del mapper).
- `mappers/`: `Entity ↔ DTO`.

**Reglas:**
- ✅ Depende de `core/` (entidades, repositories, services).
- ❌ No conoce HTTP, Prisma, bcrypt, ni Express.
- ✅ Un use case = una operación de negocio.

### 3. `infrastructure/` — Adaptadores (Frameworks & Drivers)

**Implementa los puertos de `core/` con tecnología concreta.**

- `database/prisma/`: cliente Prisma + mappers row↔domain.
- `repositories/`: implementaciones de `core/repositories` con Prisma.
- `services/`: implementaciones de `core/services` (bcrypt, JWT, pino).
- `config/env.ts`: validación de variables de entorno (Zod).
- `config/di/`: contenedor tsyringe + symbols.

**Reglas:**
- ✅ Implementa interfaces de `core/`.
- ❌ No expone tipos propios al exterior (devuelve `entity`).

### 4. `interfaces/` — HTTP (Interface Adapters)

**Traduce HTTP ↔ casos de uso.**

- `http/controllers/`: recibe `req/res`, llama use cases.
- `http/routes/`: define endpoints.
- `http/middlewares/`: validate, error, not-found.
- `http/validators/`: schemas Zod.
- `http/docs/`: Swagger UI + OpenAPI spec.

**Reglas:**
- ✅ Depende de `application/` (use cases).
- ✅ Resuelve dependencias vía DI container.
- ✅ Handlers async directos (Express 5 captura errores nativamente).
- ❌ No contiene lógica de negocio.

## Regla de dependencias 

```
interfaces  →  application  →  core
                      ↑
              infrastructure (implementa core)
                      ↑
                  main (todo)
```

Visualmente, las flechas apuntan **hacia adentro**, hacia `core`.

```
interfaces ──→ application ──→ core
       │                            ↑
       │       infrastructure ──────┘
       │
       └──→ application (no toca core directamente)
```

## Flujo de una petición: `POST /api/v1/users`

```
1. HTTP request llega a Express
2. routes/user.routes.ts → define el endpoint
3. validators + middleware validate() → valida body con Zod
4. controllers/user.controller.ts → recibe req/res
5. UseCase CreateUser.execute(dto)
   ├── Verifica email único (UserRepository)
   ├── Hashea password (HashService)
   ├── Crea entity User
   └── Persiste vía UserRepository
6. Mappers UserMapper.toDto(entity)
7. HTTP response 201 + JSON
```

Si algo falla, un `DomainError` sube por la pila. Express 5 captura rejected promises de handlers async automáticamente y los pasa al `errorMiddleware`, que mapea a status HTTP según `err.httpStatus`.

## Path aliases

Para evitar `../../../../`:

```ts
import { User } from '@core/entities/user.entity';
import { CreateUserUseCase } from '@application/usecases/user/create-user.usecase';
import { buildUserController } from '@interfaces/http/controllers/user.controller';
```

Definidos en `tsconfig.json` y reflejados en `jest.config.ts` + `tsconfig-paths` para runtime.
