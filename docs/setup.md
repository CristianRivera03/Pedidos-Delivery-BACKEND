# Configuración local

## 🚀 Setup con un comando (recomendado)

```bash
make setup
```

El wizard te pregunta:

1. **¿Qué base de datos?**
   - `1) Supabase` (nube)
   - `2) Local` (Docker)
   - `3) Ya tengo .env` (solo validar)

2. Dependiendo de tu elección, te guía paso a paso.

3. Al final ejecuta automáticamente:
   - `npm install`
   - `prisma generate`
   - `prisma migrate dev` (si confirmas)
   - `prisma:seed` (si confirmas)

4. Te muestra las URLs disponibles.

> También puedes ejecutarlo con Node directamente: `npm run setup` o `node bin/setup.mjs`

---

## Flujo A: Supabase (nube)

```
[1] Configurar Supabase
    → Pega DATABASE_URL (pooler, puerto 6543)
    → Pega DIRECT_URL  (directo, puerto 5432)
[2] Configurar secretos
    → Genera JWT_SECRET automáticamente
[3] Guardar .env
[4] Instalar dependencias
[5] Generar Prisma Client
[6] Ejecutar migraciones (vía DIRECT_URL)
[7] Cargar seed
```

### Pre-requisitos para Supabase

1. Crear proyecto en https://supabase.com
2. Anotar la **password** de DB
3. **Settings → Database → Network restrictions**: permitir `0.0.0.0/0` (o tu IP)
4. **Settings → Database → Connection string**: copiar:
   - **Transaction** (puerto 6543) → para `DATABASE_URL`
   - **Session** (puerto 5432) → para `DIRECT_URL`

---

## Flujo B: Local con Docker

```
[1] Configurar Postgres local
    → USE_LOCAL_DB=true
    → LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pedidos_delivery
[2] Configurar secretos
    → Genera JWT_SECRET automáticamente
[3] Guardar .env
[4] Instalar dependencias
[5] Generar Prisma Client
[6] Levantar Postgres en Docker (espera healthcheck)
[7] Ejecutar migraciones
[8] Cargar seed
```

No necesitas tener Postgres instalado, Docker lo levanta por ti.

---

## Flujo C: Ya tengo .env

Si ya configuraste `.env` manualmente:

```bash
make setup
# → opción 3
```

Solo valida y ejecuta los pasos finales (install, generate, migrate, seed).

---

## Setup manual (sin wizard)

Si prefieres hacerlo a mano:

### 1. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` según tu caso (ver `docs/database.md`).

### 2. Instalar y migrar

```bash
npm install
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Levantar

```bash
# Solo app
npm run dev

# App + DB local
make dev-up

# Todo en Docker
make up
```

---

## Verificar que todo funciona

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "app": "pedidos-delivery-backend",
  "env": "development"
}
```

Swagger UI: http://localhost:3000/api/docs

---

## Comandos del día a día

| Comando | Descripción |
|---|---|
| `make help` | Lista todos los comandos |
| `make dev` | App en modo watch |
| `make dev-up` | DB local + app en watch |
| `make up` | Levantar todo en Docker |
| `make down` | Apagar Docker |
| `make logs` | Ver logs en vivo |
| `make ps` | Estado de contenedores |
| `make migrate name=xxx` | Nueva migración |
| `make seed` | Cargar datos iniciales |
| `make studio` | Prisma Studio (GUI DB) |
| `make psql` | Conectarse a Postgres |
| `make test` | Tests |
| `make lint` | ESLint |
| `make typecheck` | Verificar tipos |
| `make build` | Compilar a `dist/` |
| `make fresh` | Reset DB + migrate + seed |
| `make reset` | Apagar y borrar volúmenes |

---

## pgAdmin

Solo si levantaste Docker local:

- URL: http://localhost:5050
- Email: `admin@admin.com`
- Password: `admin`

Registrar servidor con host `postgres` (no `localhost`).

---

## Solución de problemas

### "Cannot connect to database"

- Verifica `USE_LOCAL_DB` y `DATABASE_URL` en `.env`.
- Si usas Supabase: confirma que la password sea correcta.
- Si usas local: `docker ps` para ver si Postgres está corriendo.

### "Prisma Client not generated"

```bash
make generate
```

### "Direct URL is required"

Si `USE_LOCAL_DB=false`, debes definir `DIRECT_URL` (para migraciones).

### "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Resetear todo

```bash
make reset
make setup
```

---

## Requisitos

| Herramienta | Versión | Para |
|---|---|---|
| Node.js | 20+ | App + wizard |
| Docker | 24+ | Solo si usas DB local |
| Make | Cualquiera | Ejecutar comandos |
| Git | 2.x | Clonar repo |

> Si no tienes `make`, puedes ejecutar los scripts directamente con `npm run` o `node bin/setup.mjs`.