# Docker

## Servicios

| Servicio | Imagen | Puerto | Volumen |
|---|---|---|---|
| `api` | Dockerfile local | 3000 | - |
| `postgres` | postgres:16-alpine | 5433 | `pgdata` |
| `pgadmin` | dpage/pgadmin4 | 5050 | `pgadmin-data` |

## Dockerfile

Multi-stage build:

1. **dependencies**: instala `npm ci` con devDependencies.
2. **builder**: genera cliente Prisma y compila TypeScript.
3. **production**: solo runtime, usuario no-root, listo para producción.

```dockerfile
FROM node:20-alpine AS dependencies  # instala deps
FROM node:20-alpine AS builder      # compila
FROM node:20-alpine AS production   # imagen final
```

Ventajas:
- Imagen final ~150 MB (sin devDeps).
- Build cacheado por capa.
- Usuario no-root.

## docker-compose.yml

### Importante: build context

El `Dockerfile` vive en `docker/`, pero `package.json`, `prisma/`, `src/` están en la **raíz**. Por eso:

```yaml
services:
  api:
    build:
      context: ..                # ← sube un nivel desde docker/
      dockerfile: docker/Dockerfile
```

Si olvidas esto, el build falla con "package.json not found".

### Variables de entorno

```yaml
environment:
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/pedidos_delivery?schema=public
```

`@postgres` es el **nombre del servicio** en docker-compose, no `localhost`. Docker resuelve entre contenedores por nombre.

### Volúmenes

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data   # Persiste datos de Postgres
  - pgadmin-data:/var/lib/pgadmin    # Persiste config de pgAdmin
```

Sin esto, al hacer `down` se pierden los datos.

### Healthcheck

```yaml
postgres:
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U postgres -d pedidos_delivery']
    interval: 10s
    timeout: 5s
    retries: 5
```

Y en `api`:

```yaml
depends_on:
  postgres:
    condition: service_healthy   # ← espera a que DB esté lista
```

Si no, la app arranca antes de Postgres y falla la conexión.

## Comandos

```bash
# Levantar
docker compose -f docker/docker-compose.yml up -d

# Ver logs
docker compose -f docker/docker-compose.yml logs -f api
docker compose -f docker/docker-compose.yml logs -f postgres

# Estado
docker compose -f docker/docker-compose.yml ps

# Apagar (conserva datos)
docker compose -f docker/docker-compose.yml down

# Apagar y limpiar todo (incluidos volúmenes)
docker compose -f docker/docker-compose.yml down -v

# Rebuild de la imagen
docker compose -f docker/docker-compose.yml build --no-cache

# Ejecutar comandos en el contenedor
docker exec -it pedidos-api npm run prisma:migrate
docker exec -it pedidos-api npx prisma studio
docker exec -it postgres psql -U postgres -d pedidos_delivery
```

## Redes

Los servicios están en `pedidos-network` (bridge driver). Esto permite que `api` se conecte a `postgres` por nombre.

## Producción

Para despliegue:

1. Build de la imagen: `docker build -f docker/Dockerfile -t pedidos-api:1.0.0 ..`
2. Usar imagen base `postgres:16-alpine` externa (no la del compose).
3. Manejar secrets con `docker secrets` o variables de entorno seguras.
4. Healthcheck configurado en Dockerfile.
5. Usuario `nodejs` (no-root).

## Alias corto (opcional)

En `~/.bashrc` o `~/.zshrc`:

```bash
alias dcup='docker compose -f docker/docker-compose.yml up -d'
alias dcdown='docker compose -f docker/docker-compose.yml down'
alias dcps='docker compose -f docker/docker-compose.yml ps'
```
