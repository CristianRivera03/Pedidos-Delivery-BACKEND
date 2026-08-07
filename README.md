![banner](docs/images/banner-readme.png)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Version](https://img.shields.io/badge/Version-1.0-green?style=for-the-badge)


API REST para sistema de pedidos delivery. Construida con **Clean Architecture**, **Express**, **TypeScript** y **PostgreSQL** (Prisma).

## Stack

- **Node.js** 20+
- **TypeScript** 5.6
- **Express** 5
- **PostgreSQL** 16
- **Prisma** 5
- **tsyringe** (DI)
- **Zod** (validación)
- **Pino** (logging)
- **JWT + bcrypt** (servicios listos para implementar auth)
- **Docker** + docker compose

## Estructura

```
src/
├── main/              # Composition root (boot)
├── core/              # Dominio puro (entities, repositories, services)
├── application/       # Casos de uso (orquestación)
├── infrastructure/    # Adaptadores (Prisma, Bcrypt, JWT)
└── interfaces/        # HTTP (controllers, routes, validators)
```

Regla de dependencias: `interfaces → application → core` | `infrastructure → core`

## Requisitos

- Node.js 20+
- Docker + docker compose (recomendado)
- O PostgreSQL 16 local
- `make` (opcional, pero recomendado)

## Setup rápido (recomendado)

```bash
# 1. Clonar
git clone https://github.com/CristianRivera03/Pedidos-Delivery-BACKEND.git
cd Pedidos-Delivery-BACKEND

# 2. Wizard interactivo (te pregunta Supabase vs Local)
make setup
```

El wizard configura `.env`, instala dependencias, genera Prisma, migra y carga el seed automáticamente.

> Sin `make`: `npm run setup` o `node bin/setup.mjs`

## Setup manual

### Opción A: Supabase (nube)

```bash
cp .env.example .env
# Editar .env con DATABASE_URL + DIRECT_URL de Supabase
npm install
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### Opción B: Local con Docker

```bash
cp .env.example .env
# En .env: USE_LOCAL_DB=true
docker compose -f docker/docker-compose.yml up -d postgres
npm install
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Servicios:
- API: http://localhost:3000
- Health: http://localhost:3000/health
- Swagger UI: http://localhost:3000/api/docs (solo dev)
- Swagger JSON: http://localhost:3000/api/docs.json
- pgAdmin: http://localhost:5050 (admin@admin.com / admin)

## Comandos con Make

> `make` es un wrapper de los scripts de `package.json`. Si no tienes `make` instalado (Windows sin WSL), usa `npm run` directamente.

| Comando | Descripción |
|---|---|
| `make setup` | Wizard interactivo de setup |
| `make dev` | App en modo watch |
| `make dev-up` | DB local + app en watch |
| `make up` | Levantar todo en Docker |
| `make down` | Apagar Docker |
| `make logs` | Ver logs en vivo |
| `make migrate name=xxx` | Nueva migración |
| `make seed` | Cargar datos iniciales |
| `make studio` | Prisma Studio (GUI DB) |
| `make test` | Tests |
| `make lint` | ESLint |
| `make build` | Compilar a `dist/` |
| `make fresh` | Reset DB + migrate + seed |
| `make reset` | Apagar y borrar volúmenes |
| `make help` | Ver todos los comandos |

> Sin `make`: usa `npm run` con los scripts de `package.json`.

## Scripts npm

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia en watch mode |
| `npm run build` | Compila TypeScript |
| `npm start` | Ejecuta producción |
| `npm test` | Tests |
| `npm run lint` | Linter |
| `npm run format` | Prettier |
| `npm run prisma:migrate` | Nueva migración |
| `npm run prisma:seed` | Cargar seed |
| `npm run prisma:studio` | GUI de BD |

## Endpoints mockup

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/users` | Listar usuarios |
| `POST` | `/api/v1/users` | Crear usuario |
| `GET` | `/api/v1/users/:id` | Obtener usuario |
| `PATCH` | `/api/v1/users/:id` | Actualizar usuario |
| `DELETE` | `/api/v1/users/:id` | Eliminar usuario |

### Ejemplo POST /api/v1/users

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "password": "12345678"
  }'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

## Patrón para agregar un recurso

1. Entity + value-objects en `src/core/`
2. Repository interface en `src/core/repositories/`
3. Repository impl en `src/infrastructure/repositories/`
4. Use cases en `src/application/usecases/<recurso>/`
5. DTOs + mappers en `src/application/`
6. Controller + route + validator en `src/interfaces/http/`
7. Registrar DI en `src/infrastructure/config/di/container.ts`
8. Modificar `prisma/schema.prisma` si agrega modelo
