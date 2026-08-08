import { NextFunction, Request, Response } from 'express';
import { container } from 'tsyringe';

import { Role } from '@core/entities/user.entity';
import { UnauthorizedError } from '@core/errors/unauthorized.error';
import { TokenService } from '@core/services/token.service';

import { AuthTokenPayload } from '@application/dto/auth-token.dto';

import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length);
  const tokenService = container.resolve<TokenService>(SERVICE_SYMBOLS.TokenService);

  try {
    const payload = tokenService.verify<AuthTokenPayload>(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
