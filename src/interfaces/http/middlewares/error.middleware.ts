import { NextFunction, Request, Response } from 'express';

import { DomainError } from '@core/errors/domain.error';
import { LoggerService } from '@core/services/logger.service';

import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

import { container } from 'tsyringe';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const logger = container.resolve<LoggerService>(SERVICE_SYMBOLS.LoggerService);

  if (err instanceof DomainError) {
    logger.warn('Domain error', {
      path: req.path,
      method: req.method,
      error: err.message,
      status: err.httpStatus,
    });
    res.status(err.httpStatus).json({
      success: false,
      error: { type: err.name, message: err.message },
    });
    return;
  }

  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: { type: 'InternalServerError', message: 'Internal server error' },
  });
}
