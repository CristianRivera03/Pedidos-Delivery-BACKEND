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

export function buildProductRoutes(): Router {
  const router = Router();
  const controller = buildProductController();

  // Rutas públicas (catálogo y detalles)
  router.get(
    '/',
    validate(listProductsQuerySchema, 'query'),
    (req, res, next) => controller.list(req, res).catch(next),
  );

  router.get(
    '/:id',
    validate(productIdParamSchema, 'params'),
    (req, res, next) => controller.getById(req, res).catch(next),
  );

  // Rutas administrativas (ADMIN y RESTAURANT)
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
