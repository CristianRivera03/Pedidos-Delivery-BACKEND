import { Router } from 'express';

import { buildUserRoutes } from './user.routes';

export function buildApiRoutes(): Router {
  const router = Router();
  router.use('/users', buildUserRoutes());
  return router;
}
