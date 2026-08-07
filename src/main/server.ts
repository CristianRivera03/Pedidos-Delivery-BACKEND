import 'reflect-metadata';

import { createApp } from '@main/app';
import { env } from '@infrastructure/config/env';
import { container } from '@infrastructure/config/di/container';
import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { LoggerService } from '@core/services/logger.service';

async function bootstrap(): Promise<void> {
  const app = createApp();
  const logger = container.resolve<LoggerService>(SERVICE_SYMBOLS.LoggerService);
  const prisma = container.resolve<PrismaClient>(SERVICE_SYMBOLS.PrismaClient);

  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed', { error: (error as Error).message });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, {
      env: env.NODE_ENV,
      app: env.APP_NAME,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
    process.exit(1);
  });
}

void bootstrap();
