import { PrismaClient as PrismaClientBase } from '@prisma/client';
import { injectable } from 'tsyringe';

import { env } from '@infrastructure/config/env';

@injectable()
export class PrismaClient extends PrismaClientBase {
  constructor() {
    super({
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
}
