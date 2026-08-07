import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from '@infrastructure/config/env';
import { container, registerDependencies } from '@infrastructure/config/di/container';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { PinoLoggerService } from '@infrastructure/services/pino.logger.service';

import { buildApiRoutes } from '@interfaces/http/routes';
import { errorMiddleware } from '@interfaces/http/middlewares/error.middleware';
import { notFoundMiddleware } from '@interfaces/http/middlewares/not-found.middleware';
import { setupSwagger } from '@interfaces/http/docs/swagger';

export function createApp(): Application {
  registerDependencies();
  const loggerService = container.resolve<PinoLoggerService>(SERVICE_SYMBOLS.LoggerService);
  const pinoLogger = loggerService.getPinoLogger();

  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    pinoHttp({
      logger: pinoLogger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', app: env.APP_NAME, env: env.NODE_ENV });
  });

  if (env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  app.use('/api/v1', buildApiRoutes());

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
