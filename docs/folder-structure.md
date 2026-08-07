# Estructura de carpetas

Mapa completo del proyecto.

```
Pedidos-Delivery-BACKEND/
│
├── docker/
│   ├── Dockerfile                  # Build multi-stage (deps → builder → production)
│   └── docker-compose.yml          # api + postgres + pgadmin
│
├── prisma/
│   ├── schema.prisma               # Definición del modelo de datos
│   └── seed.ts                     # Datos iniciales (admin)
│
├── docs/                           # 📚 Esta carpeta
│
├── src/
│   ├── main/                       # Composition root
│   │   ├── app.ts                  # Setup de Express
│   │   └── server.ts               # Boot, graceful shutdown, signals
│   │
│   ├── core/                       # 🟡 Dominio puro
│   │   ├── entities/
│   │   │   └── user.entity.ts                   # Modelo User con comportamiento
│   │   ├── value-objects/
│   │   │   ├── email.value-object.ts            # Email validado
│   │   │   └── uuid.value-object.ts             # UUID validado
│   │   ├── repositories/
│   │   │   └── user.repository.ts               # Interface (puerto)
│   │   ├── services/
│   │   │   ├── hash.service.ts                  # Interface
│   │   │   ├── token.service.ts                 # Interface
│   │   │   └── logger.service.ts                # Interface
│   │   └── errors/
│   │       ├── domain.error.ts                  # Base abstracta
│   │       ├── not-found.error.ts               # 404
│   │       ├── conflict.error.ts                # 409
│   │       └── validation.error.ts              # 400
│   │
│   ├── application/                # 🔴 Casos de uso
│   │   ├── usecases/
│   │   │   └── user/
│   │   │       ├── create-user.usecase.ts       # POST /users
│   │   │       ├── get-user.usecase.ts          # GET /users/:id
│   │   │       ├── list-users.usecase.ts        # GET /users
│   │   │       ├── update-user.usecase.ts       # PATCH /users/:id
│   │   │       └── delete-user.usecase.ts       # DELETE /users/:id
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts               # CreateUserDto, UpdateUserDto
│   │   │   └── user-response.dto.ts             # UserResponseDto
│   │   └── mappers/
│   │       └── user.mapper.ts                   # Entity ↔ DTO
│   │
│   ├── infrastructure/             # 🔵 Adaptadores
│   │   ├── database/
│   │   │   └── prisma/
│   │   │       ├── prisma.client.ts             # Singleton PrismaClient
│   │   │       └── user.prisma.mapper.ts        # Prisma row ↔ Domain
│   │   ├── repositories/
│   │   │   └── user.prisma.repository.ts        # Implementa UserRepository
│   │   ├── services/
│   │   │   ├── bcrypt.hash.service.ts           # Implementa HashService
│   │   │   ├── jwt.token.service.ts             # Implementa TokenService
│   │   │   └── pino.logger.service.ts           # Implementa LoggerService
│   │   └── config/
│   │       ├── env.ts                           # Zod validation
│   │       └── di/
│   │           ├── container.ts                 # registerDependencies()
│   │           └── symbols.ts                   # Tokens Symbol.for()
│   │
│   ├── interfaces/                 # 🟢 HTTP
│   │   └── http/
│   │       ├── controllers/
│   │       │   └── user.controller.ts           # Manipula req/res
│   │       ├── routes/
│   │       │   ├── index.ts                     # /api/v1 aggregator
│   │       │   └── user.routes.ts               # /users router
│   │       ├── middlewares/
│   │       │   ├── error.middleware.ts          # Catch + status HTTP
│   │       │   ├── not-found.middleware.ts     # 404
│   │       │   └── validate.middleware.ts       # Zod sync
│   │       ├── validators/
│   │       │   └── user.validator.ts            # Schemas
│   │       └── docs/
│   │           ├── swagger.config.ts            # OpenAPI spec
│   │           └── swagger.ts                   # Swagger UI setup
│
├── bin/                             # Setup wizard
│   ├── setup.mjs                    # Wizard interactivo
│   └── lib/
│       ├── env.mjs                  # Leer/escribir .env
│       ├── exec.mjs                 # Prompts, colores, exec
│       └── validators.mjs          # Validar URLs Postgres/Supabase
│
├── tests/                          # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                    # Plantilla de variables
├── .gitignore
├── .dockerignore
├── .eslintrc.cjs
├── .prettierrc
├── jest.config.ts
├── jest.e2e.config.ts              # Config de tests e2e
├── package.json
├── tsconfig.json
├── tsconfig.eslint.json             # Config para ESLint (incluye config files)
├── tsconfig.seed.json              # Solo para prisma/seed.ts
├── Makefile                         # Comandos make
└── README.md
```

## ¿Qué va dónde?

| Si vas a... | Va en... |
|---|---|
| Definir un objeto con identidad | `core/entities/` |
| Validar un tipo primitivo | `core/value-objects/` |
| Definir contrato de persistencia | `core/repositories/` |
| Definir contrato de servicio externo | `core/services/` |
| Crear un error tipado | `core/errors/` |
| Orquestar una operación de negocio | `application/usecases/<recurso>/` |
| Definir contrato de entrada/salida | `application/dto/` |
| Convertir entity ↔ DTO | `application/mappers/` |
| Implementar con Prisma | `infrastructure/repositories/` |
| Implementar con bcrypt/JWT/Pino | `infrastructure/services/` |
| Configurar DI | `infrastructure/config/di/` |
| Definir endpoint | `interfaces/http/routes/` |
| Manejar req/res | `interfaces/http/controllers/` |
| Validar body/params | `interfaces/http/validators/` |
| Middleware HTTP | `interfaces/http/middlewares/` |
