import { Router } from 'express';

import { buildUserController, UserController } from '@interfaces/http/controllers/user.controller';
import { validate, validateAll } from '@interfaces/http/middlewares/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from '@interfaces/http/validators/user.validator';

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: Endpoints para gestión de usuarios
 */

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
export function buildUserRoutes(controller: UserController = buildUserController()): Router {
  const router = Router();

  router.get('/', async (req, res) => controller.list(req, res));
  router.post(
    '/',
    validate(createUserSchema, 'body'),
    async (req, res) => controller.create(req, res),
  );

  /**
   * @openapi
   * /users/{id}:
   *   get:
   *     summary: Obtener un usuario por ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Usuario encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *   patch:
   *     summary: Actualizar un usuario (parcial)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserRequest'
   *     responses:
   *       200:
   *         description: Usuario actualizado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   *   delete:
   *     summary: Eliminar un usuario
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         description: Usuario eliminado
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get(
    '/:id',
    validate(userIdParamSchema, 'params'),
    async (req, res) => controller.getById(req, res),
  );
  router.patch(
    '/:id',
    validateAll(updateUserSchema),
    async (req, res) => controller.update(req, res),
  );
  router.delete(
    '/:id',
    validate(userIdParamSchema, 'params'),
    async (req, res) => controller.delete(req, res),
  );

  return router;
}