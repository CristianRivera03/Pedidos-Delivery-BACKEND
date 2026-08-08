import { NextFunction, Request, Response } from 'express';

import { Role } from '@core/entities/user.entity';
import { ForbiddenError } from '@core/errors/forbidden.error';
import { UnauthorizedError } from '@core/errors/unauthorized.error';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}

export function selfOrRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (req.user.id === req.params.id || roles.includes(req.user.role)) {
      next();
      return;
    }
    next(new ForbiddenError());
  };
}
