import { Router } from 'express';

import { buildAuthRoutes } from './auth.routes';
import { buildCategoryRoutes } from './category.routes';
import { buildProductRoutes } from './product.routes';
import { buildOrderRoutes } from './order.routes';
import { buildUserRoutes } from './user.routes';

export function buildApiRoutes(): Router {
  const router = Router();
  router.use('/auth', buildAuthRoutes());
  router.use('/users', buildUserRoutes());
  router.use('/categories', buildCategoryRoutes());
  router.use('/products', buildProductRoutes());
  router.use('/orders', buildOrderRoutes());
  return router;
}
