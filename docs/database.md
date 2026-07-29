# Base de datos

## Opciones de origen

El proyecto soporta **dos orígenes** de base de datos, controlados por `USE_LOCAL_DB` en `.env`:

| `USE_LOCAL_DB` | Origen | Cuándo usarlo |
|---|---|---|
| `true` | Postgres en Docker (local) | Dev sin internet, CI, tests |
| `false` | Supabase (nube) | Dev compartido, staging, prod |

## Prisma

ORM principal. Genera un cliente tipado desde `schema.prisma`.

### Schema

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- `DATABASE_URL`: conexión principal (pooler en Supabase).
- `directUrl`: conexión directa (para migraciones, no soporta pooler).

### Modelo actual

```prisma
model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  name         String   @db.VarChar(100)
  passwordHash String   @map("password_hash")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

Convenciones:
- Tabla en `snake_case` plural (`users`).
- Columnas en `snake_case`.
- IDs como `UUID` (`@db.Uuid`).
- Timestamps en snake_case (`created_at`, `updated_at`).

### Cliente

Singleton en `src/infrastructure/database/prisma/prisma.client.ts`:

```ts
import { PrismaClient as PrismaClientBase } from '@prisma/client';
import { injectable } from 'tsyringe';

import { env } from '@infrastructure/config/env';

@injectable()
export class PrismaClient extends PrismaClientBase {
  constructor() {
    super({
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
}
```

Se inyecta vía `SERVICE_SYMBOLS.PrismaClient`.

## Supabase en la nube


### 1. Crear proyecto

1. Ir a https://supabase.com
2. Crear cuenta / login
3. New project → elegir región cercana → password de DB
4. Esperar ~2 minutos a que se aprovisione

### 2. Obtener credenciales

En Supabase: **Settings → Database → Connection string**

Necesitas **dos URLs**:

| Tipo | Puerto | Usage | Ejemplo |
|---|---|---|---|
| Transaction (pooler) | 6543 | `DATABASE_URL` (app) | `pooler.supabase.com:6543` |
| Session (directo) | 5432 | `DIRECT_URL` (migraciones) | `pooler.supabase.com:5432` |

Ambas con `?pgbouncer=true&connection_limit=1` en la pooler.

### 3. Configurar `.env`

```env
USE_LOCAL_DB=false
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

⚠️ **Importante**: reemplazar `[PASSWORD]` con la password definida al crear el proyecto.

### 4. Verificar IP allowlist

En Supabase: **Settings → Database → Network restrictions**

- `0.0.0.0/0` permite cualquier IP (útil en dev).
- Para producción, restringir a IPs conocidas.

### 5. Migrar

```bash
# Prisma usa DIRECT_URL automáticamente para migrate
npx prisma migrate dev --name init
```

### Ventajas de Supabase vs local

| | Local Docker | Supabase |
|---|---|---|
| Costo | Gratis | Gratis (free tier) |
| Latencia | Muy baja | Mayor (red) |
| Backups | Manual | Automáticos (pro) |
| Dashboard | Solo pgAdmin | Web propio |
| Tiempo real | No | Sí (realtime) |
| Storage | No | Sí |
| Auth | Manual | Incluido |


## Cambiar entre origen

Solo editar `.env`:

```env
# Volver a local
USE_LOCAL_DB=true
LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pedidos_delivery?schema=public
```

Y reiniciar la app. La lógica está en `src/infrastructure/config/env.ts`.

## Migrations

```bash
npm run prisma:migrate -- --name add_orders  # desarrollo
npm run prisma:deploy                        # producción
```

## Seed

```bash
npm run prisma:seed
```

Configurado en `package.json`:

```json
"prisma": {
  "seed": "ts-node --project tsconfig.seed.json prisma/seed.ts"
}
```

## Buenas prácticas

- No usar `prisma` directamente fuera de `infrastructure/`.
- No exponer tipos de Prisma en use cases (usar entity).
- Validaciones complejas en el dominio, no en el schema.
- Índices en columnas frecuentemente consultadas (`@@index`).
- **Nunca commitear el `.env`** (está en `.gitignore`).
- En Supabase, rotar password periódicamente.
