import { createHash, randomBytes } from 'crypto';

import { injectable } from 'tsyringe';

import { RefreshTokenService } from '@core/services/refresh-token.service';

import { env } from '@infrastructure/config/env';

const REFRESH_TOKEN_BYTES = 64;

@injectable()
export class CryptoRefreshTokenService implements RefreshTokenService {
  public generate(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  public hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  public getExpiresAt(): Date {
    const days = env.REFRESH_TOKEN_EXPIRES_IN_DAYS;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
