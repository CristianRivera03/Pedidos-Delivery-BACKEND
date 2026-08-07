import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcrypt';

import { HashService } from '@core/services/hash.service';

import { env } from '@infrastructure/config/env';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { LoggerService } from '@core/services/logger.service';

@injectable()
export class BcryptHashService implements HashService {
  constructor(
    @inject(SERVICE_SYMBOLS.LoggerService) private readonly logger: LoggerService,
  ) {}

  public async hash(plain: string): Promise<string> {
    const start = Date.now();
    const hashed = await bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
    this.logger.debug('Password hashed', { durationMs: Date.now() - start });
    return hashed;
  }

  public async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
