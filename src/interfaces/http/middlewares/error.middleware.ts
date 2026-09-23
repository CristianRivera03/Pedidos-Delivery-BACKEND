import { NextFunction, Request, Response } from 'express';

import { getElSalvadorNowIsoString } from '@application/utils/el-salvador-date.util';
import { DomainError } from '@core/errors/domain.error';
import { LoggerService } from '@core/services/logger.service';
import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';
import { ApiErrorResponse } from '@interfaces/http/responses/api-response.interface';

import { container } from 'tsyringe';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const logger = container.resolve<LoggerService>(SERVICE_SYMBOLS.LoggerService);
  const path = req.originalUrl || req.path;
  const timestamp = getElSalvadorNowIsoString();

  if (err instanceof DomainError) {
    logger.warn('Domain error', {
      path,
      method: req.method,
      error: err.message,
      status: err.httpStatus,
    });

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode: err.httpStatus,
      error: { type: err.name, message: err.message },
      timestamp,
      path,
    };

    res.status(err.httpStatus).json(errorResponse);
    return;
  }

  logger.error('Unhandled error', {
    path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  const internalResponse: ApiErrorResponse = {
    success: false,
    statusCode: 500,
    error: { type: 'InternalServerError', message: 'Internal server error' },
    timestamp,
    path,
  };

  res.status(500).json(internalResponse);
}
