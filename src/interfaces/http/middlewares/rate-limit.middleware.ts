import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

import { getElSalvadorNowIsoString } from '@application/utils/el-salvador-date.util';
import { env } from '@infrastructure/config/env';
import { ApiErrorResponse } from '@interfaces/http/responses/api-response.interface';

export function loginRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    limit: env.LOGIN_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const path = req.originalUrl || req.path;
      const response: ApiErrorResponse = {
        success: false,
        statusCode: 429,
        error: {
          type: 'TooManyRequestsError',
          message: 'Too many login attempts, please try again later',
        },
        timestamp: getElSalvadorNowIsoString(),
        path,
      };
      res.status(429).json(response);
    },
  });
}
