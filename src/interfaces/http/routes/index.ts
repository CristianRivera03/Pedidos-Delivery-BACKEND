import { Router } from 'express';

import { buildAuthRoutes } from './auth.routes';
import { buildUserRoutes } from './user.routes';

export function buildApiRoutes(): Router {
  const router = Router();
  router.use('/auth', buildAuthRoutes());
  router.use('/users', buildUserRoutes());
  return router;
}
