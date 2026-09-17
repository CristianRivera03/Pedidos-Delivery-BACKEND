import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

import { env } from '@infrastructure/config/env';

export function loginRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    limit: env.LOGIN_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          type: 'TooManyRequestsError',
          message: 'Too many login attempts, please try again later',
        },
      });
    },
  });
}
