import { NextFunction, Request, Response } from 'express';

import { getElSalvadorNowIsoString } from '@application/utils/el-salvador-date.util';
import { ApiErrorResponse } from '@interfaces/http/responses/api-response.interface';

export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction): void {
  const path = req.originalUrl || req.path;
  const response: ApiErrorResponse = {
    success: false,
    statusCode: 404,
    error: {
      type: 'NotFound',
      message: `Route ${req.method} ${path} not found`,
    },
    timestamp: getElSalvadorNowIsoString(),
    path,
  };

  res.status(404).json(response);
}
