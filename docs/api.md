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

## Users

### `POST /api/v1/users`

Crear un usuario.

**Body:**
```json
{
  "email": "juan@example.com",
  "name": "Juan Pérez",
  "password": "12345678"
}
```

**Validaciones:**
- `email`: formato válido.
- `name`: 2-100 caracteres.
- `password`: 8-100 caracteres.

**Respuestas:**

`201 Created`:
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

Listar todos los usuarios.

**Respuesta `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "juan@example.com",
      "name": "Juan Pérez",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/v1/users/:id`

Obtener un usuario por ID.

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

Actualizar un usuario (parcial).

**Body** (todos los campos opcionales):
```json
{
  "email": "nuevo@example.com",
  "name": "Juan Pérez Updated",
  "password": "nuevaPassword123",
  "isActive": false
}
```

**Respuestas:**

`200 OK`: usuario actualizado.
`400 Bad Request`: validación.
`404 Not Found`: no existe.
`409 Conflict`: email en uso por otro usuario.

---

### `DELETE /api/v1/users/:id`

Eliminar un usuario.

**Respuestas:**

`204 No Content`: eliminado.

`404 Not Found`: no existe.

## Códigos de error

| Status | Type | Cuándo |
|---|---|---|
| `400` | `ValidationError` | Body/params no válidos |
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
- `Authorization: Bearer <token>` (cuando se implemente auth).

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

- `User`
- `CreateUserRequest`
- `UpdateUserRequest`
- `SuccessResponse`
- `ErrorResponse`
- `NotFound`, `BadRequest`, `Conflict`, `InternalServerError`
