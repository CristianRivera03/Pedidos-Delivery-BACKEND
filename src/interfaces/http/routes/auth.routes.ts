import { Router } from 'express';

import { AuthController, buildAuthController } from '@interfaces/http/controllers/auth.controller';
import { validate } from '@interfaces/http/middlewares/validate.middleware';
import { loginSchema, registerSchema } from '@interfaces/http/validators/auth.validator';

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Registro y autenticación
 */

export function buildAuthRoutes(controller: AuthController = buildAuthController()): Router {
  const router = Router();

  /**
   * @openapi
   * /auth/register:
   *   post:
   *     summary: Registrar un nuevo usuario
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: Usuario registrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   */
  router.post(
    '/register',
    validate(registerSchema, 'body'),
    async (req, res) => controller.register(req, res),
  );

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     summary: Iniciar sesión
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post(
    '/login',
    validate(loginSchema, 'body'),
    async (req, res) => controller.login(req, res),
  );

  return router;
}
