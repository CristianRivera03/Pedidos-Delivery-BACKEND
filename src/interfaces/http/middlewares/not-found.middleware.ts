import { NextFunction, Request, Response } from 'express';

export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: {
      type: 'NotFound',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
