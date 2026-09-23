import { Router } from 'express';
import { buildCategoryController } from '@interfaces/http/controllers/category.controller';
import { authGuard } from '@interfaces/http/middlewares/auth.middleware';
import { authorize } from '@interfaces/http/middlewares/role.middleware';
import { validate, validateAll } from '@interfaces/http/middlewares/validate.middleware';
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@interfaces/http/validators/category.validator';

/**
 * @openapi
 * tags:
 *   name: Categories
 *   description: Endpoints para catálogo y gestión de categorías
 */

export function buildCategoryRoutes(): Router {
  const router = Router();
  const controller = buildCategoryController();

  /**
   * @openapi
   * /categories:
   *   get:
   *     summary: Listar todas las categorías activas
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: Lista de categorías
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
   *                     $ref: '#/components/schemas/Category'
   *                 meta:
   *                   type: object
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   *   post:
   *     summary: Crear una nueva categoría (ADMIN o RESTAURANT)
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryRequest'
   *     responses:
   *       201:
   *         description: Categoría creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Category'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   */
  router.get('/', (req, res, next) => controller.list(req, res).catch(next));

  /**
   * @openapi
   * /categories/{id}:
   *   get:
   *     summary: Obtener una categoría por ID
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Categoría encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Category'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *   patch:
   *     summary: Actualizar una categoría (ADMIN o RESTAURANT)
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
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
   *             $ref: '#/components/schemas/UpdateCategoryRequest'
   *     responses:
   *       200:
   *         description: Categoría actualizada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Category'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   *   delete:
   *     summary: Eliminar una categoría (ADMIN o RESTAURANT)
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         description: Categoría eliminada exitosamente (Soft Delete)
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         description: Conflicto (tiene productos asociados)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/:id',
    validate(categoryIdParamSchema, 'params'),
    (req, res, next) => controller.getById(req, res).catch(next),
  );

  router.post(
    '/',
    authGuard,
    authorize('ADMIN', 'RESTAURANT'),
    validate(createCategorySchema, 'body'),
    (req, res, next) => controller.create(req, res).catch(next),
  );

  router.patch(
    '/:id',
    authGuard,
    authorize('ADMIN', 'RESTAURANT'),
    validateAll(updateCategorySchema),
    (req, res, next) => controller.update(req, res).catch(next),
  );

  router.delete(
    '/:id',
    authGuard,
    authorize('ADMIN', 'RESTAURANT'),
    validate(categoryIdParamSchema, 'params'),
    (req, res, next) => controller.delete(req, res).catch(next),
  );

  return router;
}
