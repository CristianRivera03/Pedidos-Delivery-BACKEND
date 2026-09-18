import { Response, Request } from 'express';

import { getElSalvadorNowIsoString } from '@application/utils/el-salvador-date.util';

import { ApiSuccessResponse } from './api-response.interface';

export function sendSuccess<T>(
  req: Request,
  res: Response,
  data: T,
  statusCode: number = 200,
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    statusCode,
    data,
    timestamp: getElSalvadorNowIsoString(),
    path: req.originalUrl || req.path,
  };
  res.status(statusCode).json(response);
}
