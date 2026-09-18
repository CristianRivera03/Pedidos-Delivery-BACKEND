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

export function buildCategoryRoutes(): Router {
  const router = Router();
  const controller = buildCategoryController();

  // Rutas públicas (para catálogo)
  router.get('/', (req, res, next) => controller.list(req, res).catch(next));
  router.get(
    '/:id',
    validate(categoryIdParamSchema, 'params'),
    (req, res, next) => controller.getById(req, res).catch(next),
  );

  // Rutas administrativas (ADMIN y RESTAURANT)
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
