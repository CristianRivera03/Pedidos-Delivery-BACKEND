import { Router } from 'express';
import { buildOrderController } from '@interfaces/http/controllers/order.controller';
import { authGuard } from '@interfaces/http/middlewares/auth.middleware';
import { authorize } from '@interfaces/http/middlewares/role.middleware';
import { validate, validateAll } from '@interfaces/http/middlewares/validate.middleware';
import {
  checkoutOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from '@interfaces/http/validators/order.validator';

/**
 * @openapi
 * tags:
 *   name: Orders
 *   description: Checkout, seguimiento y ciclo de vida de pedidos
 */

export function buildOrderRoutes(): Router {
  const router = Router();
  const controller = buildOrderController();

  /**
   * @openapi
   * /orders:
   *   post:
   *     summary: Checkout — crea un pedido (CUSTOMER)
   *     description: Crea la orden de forma atómica (cabecera + detalle + descuento de inventario) y la marca como PAGADO automáticamente (CARD vía pasarela simulada, CASH contra entrega).
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOrderRequest'
   *     responses:
   *       201:
   *         description: Pedido creado y pagado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         description: Producto no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Stock insuficiente para uno o más productos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *   get:
   *     summary: Listar pedidos
   *     description: CUSTOMER solo ve sus propios pedidos; ADMIN, DELIVERY y RESTAURANT ven todos.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           $ref: '#/components/schemas/OrderStatus'
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar por cliente (ignorado si el solicitante es CUSTOMER)
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Lista de pedidos con metadata de paginación
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post(
    '/',
    authGuard,
    authorize('CUSTOMER'),
    validate(checkoutOrderSchema, 'body'),
    (req, res, next) => controller.checkout(req, res).catch(next),
  );

  router.get(
    '/',
    authGuard,
    authorize('ADMIN', 'CUSTOMER', 'DELIVERY', 'RESTAURANT'),
    validate(listOrdersQuerySchema, 'query'),
    (req, res, next) => controller.list(req, res).catch(next),
  );

  /**
   * @openapi
   * /orders/{id}:
   *   get:
   *     summary: Obtener un pedido por ID
   *     description: El dueño del pedido (CUSTOMER) o ADMIN/DELIVERY/RESTAURANT pueden consultarlo.
   *     tags: [Orders]
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
   *       200:
   *         description: Pedido encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get(
    '/:id',
    authGuard,
    authorize('ADMIN', 'CUSTOMER', 'DELIVERY', 'RESTAURANT'),
    validate(orderIdParamSchema, 'params'),
    (req, res, next) => controller.getById(req, res).catch(next),
  );

  /**
   * @openapi
   * /orders/{id}/status:
   *   patch:
   *     summary: Actualizar el estado de un pedido (ciclo de vida)
   *     description: |
   *       Avanza el pedido en su máquina de estados finita.
   *       - EN_PREPARACION → ADMIN o RESTAURANT
   *       - EN_CAMINO / ENTREGADO → ADMIN o DELIVERY
   *       - CANCELADO → ADMIN o el CUSTOMER dueño del pedido (solo antes de EN_CAMINO)
   *       PAGADO/CREADO no son destinos válidos aquí (solo se asignan durante el checkout).
   *     tags: [Orders]
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
   *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
   *     responses:
   *       200:
   *         description: Estado actualizado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       400:
   *         description: Transición de estado inválida
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.patch(
    '/:id/status',
    authGuard,
    authorize('ADMIN', 'CUSTOMER', 'DELIVERY', 'RESTAURANT'),
    validateAll(updateOrderStatusSchema),
    (req, res, next) => controller.updateStatus(req, res).catch(next),
  );

  return router;
}
