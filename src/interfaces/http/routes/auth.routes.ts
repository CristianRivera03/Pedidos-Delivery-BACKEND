import { Router } from 'express';

import { AuthController, buildAuthController } from '@interfaces/http/controllers/auth.controller';
import { loginRateLimiter } from '@interfaces/http/middlewares/rate-limit.middleware';
import { validate } from '@interfaces/http/middlewares/validate.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from '@interfaces/http/validators/auth.validator';

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
   *       429:
   *         description: Demasiados intentos de login
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/login',
    loginRateLimiter(),
    validate(loginSchema, 'body'),
    async (req, res) => controller.login(req, res),
  );

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     summary: Renovar el access token usando un refresh token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshTokenRequest'
   *     responses:
   *       200:
   *         description: Tokens renovados
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post(
    '/refresh',
    validate(refreshTokenSchema, 'body'),
    async (req, res) => controller.refresh(req, res),
  );

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     summary: Revocar un refresh token (cerrar sesión)
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshTokenRequest'
   *     responses:
   *       200:
   *         description: Sesión cerrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   */
  router.post(
    '/logout',
    validate(refreshTokenSchema, 'body'),
    async (req, res) => controller.logout(req, res),
  );

  return router;
}
