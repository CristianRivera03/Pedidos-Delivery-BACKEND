import { injectable } from 'tsyringe';
import pino, { Logger as PinoLogger } from 'pino';

import { LoggerService } from '@core/services/logger.service';

import { env } from '@infrastructure/config/env';

@injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: PinoLogger;

  constructor() {
    this.logger = pino({
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
          : undefined,
    });
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(meta ?? {}, message);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(meta ?? {}, message);
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(meta ?? {}, message);
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(meta ?? {}, message);
  }

  public getPinoLogger(): PinoLogger {
    return this.logger;
  }
}