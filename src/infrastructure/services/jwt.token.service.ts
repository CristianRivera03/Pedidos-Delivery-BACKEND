import { inject, injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';

import { TokenService } from '@core/services/token.service';

import { env } from '@infrastructure/config/env';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { LoggerService } from '@core/services/logger.service';

@injectable()
export class JwtTokenService implements TokenService {
  constructor(
    @inject(SERVICE_SYMBOLS.LoggerService) private readonly logger: LoggerService,
  ) {}

  public sign(payload: Record<string, unknown>): string {
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
    this.logger.debug('Token signed');
    return token;
  }

  public verify<T = Record<string, unknown>>(token: string): T {
    return jwt.verify(token, env.JWT_SECRET) as T;
  }
}
