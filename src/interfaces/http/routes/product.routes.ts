import { Router } from 'express';
import { buildProductController } from '@interfaces/http/controllers/product.controller';
import { authGuard } from '@interfaces/http/middlewares/auth.middleware';
import { authorize } from '@interfaces/http/middlewares/role.middleware';
import { validate, validateAll } from '@interfaces/http/middlewares/validate.middleware';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
} from '@interfaces/http/validators/product.validator';

/**
 * @openapi
 * tags:
 *   name: Products
 *   description: Endpoints para catálogo y gestión de productos (menú)
 */

export function buildProductRoutes(): Router {
  const router = Router();
  const controller = buildProductController();

  /**
   * @openapi
   * /products:
   *   get:
   *     summary: Listar productos con filtros opcionales
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar productos por categoría
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por coincidencia en nombre del producto
   *       - in: query
   *         name: activeOnly
   *         schema:
   *           type: boolean
   *         description: Filtrar solo productos activos (por defecto true)
   *     responses:
   *       200:
   *         description: Lista de productos encontrados
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
   *                     $ref: '#/components/schemas/Product'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   *   post:
   *     summary: Crear un nuevo producto (ADMIN o RESTAURANT)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProductRequest'
   *     responses:
   *       201:
   *         description: Producto creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       400:
   *         description: Error de validación (ej. precio <= 0, stock < 0)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         description: Categoría no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/',
    validate(listProductsQuerySchema, 'query'),
    (req, res, next) => controller.list(req, res).catch(next),
  );

  /**
   * @openapi
   * /products/{id}:
   *   get:
   *     summary: Obtener un producto por ID
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Producto encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *   patch:
   *     summary: Actualizar un producto (ADMIN o RESTAURANT)
   *     tags: [Products]
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
   *             $ref: '#/components/schemas/UpdateProductRequest'
   *     responses:
   *       200:
   *         description: Producto actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *   delete:
   *     summary: Eliminar un producto (ADMIN o RESTAURANT)
   *     tags: [Products]
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
   *         description: Producto eliminado exitosamente (Soft Delete)
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get(
    '/:id',
    validate(productIdParamSchema, 'params'),
    (req, res, next) => controller.getById(req, res).catch(next),
  );

  router.post(
    '/',
    authGuard,
    authorize('ADMIN', 'RESTAURANT'),
    validate(createProductSchema, 'body'),
    (req, res, next) => controller.create(req, res).catch(next),
  );

  router.patch(
    '/:id',
    authGuard,
    authorize('ADMIN', 'RESTAURANT'),
    validateAll(updateProductSchema),
    (req, res, next) => controller.update(req, res).catch(next),
  );

  router.delete(
    '/:id',
    authGuard,
    authorize('ADMIN', 'RESTAURANT'),
    validate(productIdParamSchema, 'params'),
    (req, res, next) => controller.delete(req, res).catch(next),
  );

  return router;
}
