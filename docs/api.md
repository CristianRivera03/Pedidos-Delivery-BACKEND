# API REST

Base URL: `http://localhost:3000/api/v1`

## 📚 Documentación interactiva

| URL | Descripción |
|---|---|
| http://localhost:3000/api/docs | Swagger UI (solo en desarrollo) |
| http://localhost:3000/api/docs.json | OpenAPI spec en JSON |

> Swagger UI se desactiva automáticamente cuando `NODE_ENV=production`.

## Health

### `GET /health`

```bash
curl http://localhost:3000/health
```

Respuesta `200`:
```json
{
  "status": "ok",
  "app": "pedidos-delivery-backend",
  "env": "development"
}
```

## Auth

Todas las rutas protegidas requieren `Authorization: Bearer <token>`. El token se obtiene
en `/auth/register` o `/auth/login` y contiene `sub` (id), `email` y `role`.

Roles disponibles: `ADMIN`, `CUSTOMER`, `DELIVERY`, `RESTAURANT`.

### `POST /api/v1/auth/register`

Registro público. `role` es opcional (`CUSTOMER` por defecto) y **no permite** `ADMIN`.

**Body:**
```json
{
  "email": "juan@example.com",
  "name": "Juan Pérez",
  "password": "12345678",
  "role": "RESTAURANT"
}
```

**Respuestas:**

`201 Created`:
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "juan@example.com",
      "name": "Juan Pérez",
      "role": "RESTAURANT",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

`400 Bad Request`: validación (incluye intentar mandar `role: "ADMIN"`).
`409 Conflict`: email duplicado.

---

### `POST /api/v1/auth/login`

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "12345678"
}
```

**Respuestas:**

`200 OK`: igual forma que `/auth/register` (`{ token, user }`).
`401 Unauthorized`: credenciales inválidas (mensaje genérico, no distingue email inexistente
de password incorrecto).

## Users

Todas las rutas requieren token (`authGuard`). Además:

| Endpoint | Quién puede |
|---|---|
| `GET /users` | Solo `ADMIN` |
| `POST /users` | Solo `ADMIN` (puede asignar cualquier rol, incluido `ADMIN`) |
| `GET /users/:id` | Dueño del recurso o `ADMIN` |
| `PATCH /users/:id` | Dueño del recurso o `ADMIN` (el campo `role` se ignora si no eres `ADMIN`) |
| `DELETE /users/:id` | Solo `ADMIN` |

### `POST /api/v1/users`

Crear un usuario.

**Body:**
```json
{
  "email": "juan@example.com",
  "name": "Juan Pérez",
  "password": "12345678",
  "role": "DELIVERY"
}
```

**Validaciones:**
- `email`: formato válido.
- `name`: 2-100 caracteres.
- `password`: 8-100 caracteres.
- `role`: opcional, uno de `ADMIN`, `CUSTOMER`, `DELIVERY`, `RESTAURANT` (default `CUSTOMER`).

**Respuestas:**

`201 Created`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "role": "DELIVERY",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

`400 Bad Request` (validación):
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "email: Invalid email format"
  }
}
```

`401 Unauthorized` / `403 Forbidden`: falta token o no eres `ADMIN`.

`409 Conflict` (email duplicado):
```json
{
  "success": false,
  "error": {
    "type": "ConflictError",
    "message": "User with email 'juan@example.com' already exists"
  }
}
```

---

### `GET /api/v1/users`

Listar todos los usuarios (solo `ADMIN`).

**Respuesta `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "juan@example.com",
      "name": "Juan Pérez",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/v1/users/:id`

Obtener un usuario por ID (dueño o `ADMIN`).

**Parámetros:**
- `id` (UUID, path).

**Respuestas:**

`200 OK`:
```json
{
  "success": true,
  "data": { /* user */ }
}
```

`401 Unauthorized` / `403 Forbidden`: falta token o no eres el dueño ni `ADMIN`.

`404 Not Found`:
```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "User with identifier 'xxx' was not found"
  }
}
```

---

### `PATCH /api/v1/users/:id`

Actualizar un usuario (parcial, dueño o `ADMIN`).

**Body** (todos los campos opcionales):
```json
{
  "email": "nuevo@example.com",
  "name": "Juan Pérez Updated",
  "password": "nuevaPassword123",
  "role": "ADMIN",
  "isActive": false
}
```

> `role` solo se aplica si quien llama es `ADMIN`; si no, se descarta silenciosamente.

**Respuestas:**

`200 OK`: usuario actualizado.
`400 Bad Request`: validación.
`401 Unauthorized` / `403 Forbidden`: falta token o no eres el dueño ni `ADMIN`.
`404 Not Found`: no existe.
`409 Conflict`: email en uso por otro usuario.

---

### `DELETE /api/v1/users/:id`

Eliminar un usuario (solo `ADMIN`).

**Respuestas:**

`204 No Content`: eliminado.

`401 Unauthorized` / `403 Forbidden`: falta token o no eres `ADMIN`.

`404 Not Found`: no existe.

## Códigos de error

| Status | Type | Cuándo |
|---|---|---|
| `400` | `ValidationError` | Body/params no válidos |
| `401` | `UnauthorizedError` | Token faltante, inválido o credenciales incorrectas |
| `403` | `ForbiddenError` | Autenticado pero sin permiso para el recurso |
| `404` | `NotFoundError` | Recurso no existe |
| `409` | `ConflictError` | Duplicado (email) |
| `500` | `InternalServerError` | Error no controlado |

## Formato de respuesta

Éxito:
```json
{ "success": true, "data": ... }
```

Error:
```json
{
  "success": false,
  "error": { "type": "ErrorType", "message": "..." }
}
```

## Headers

- `Content-Type: application/json` (todas las requests).
- `Authorization: Bearer <token>` (requerido en todas las rutas de `/users`, obtenido en
  `/auth/register` o `/auth/login`).

## CORS

Por defecto abierto en desarrollo. Configurar en producción en `app.ts`.

## Cómo documentar nuevos endpoints

Swagger lee los comentarios JSDoc en `src/interfaces/http/routes/*.ts`. Patrón:

```ts
/**
 * @openapi
 * /users:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', ...)
```

Schemas reutilizables (en `swagger.config.ts`):

- `User`, `Role`
- `CreateUserRequest`, `UpdateUserRequest`
- `RegisterRequest`, `LoginRequest`, `AuthResponse`
- `SuccessResponse`
- `ErrorResponse`
- `NotFound`, `BadRequest`, `Conflict`, `Unauthorized`, `Forbidden`, `InternalServerError`
