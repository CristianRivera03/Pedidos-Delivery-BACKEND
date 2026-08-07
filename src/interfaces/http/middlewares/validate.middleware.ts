import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { ValidationError } from '@core/errors/validation.error';

type Source = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const input = { [source]: req[source] };
      const parsed = schema.parse(input) as Record<Source, unknown>;
      const value = parsed[source];
      if (value !== undefined) {
        switch (source) {
          case 'body':
            req.body = value as Record<string, unknown>;
            break;
          case 'params':
            req.params = value as Record<string, string>;
            break;
          case 'query':
            req.query = value as Record<string, string | string[]>;
            break;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(messages));
        return;
      }
      next(error);
    }
  };
}

export function validateAll(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const input = { body: req.body, params: req.params, query: req.query };
      const parsed = schema.parse(input) as Record<Source, unknown>;

      if (parsed.body) req.body = parsed.body as Record<string, unknown>;
      if (parsed.params) req.params = parsed.params as Record<string, string>;
      if (parsed.query) req.query = parsed.query as Record<string, string | string[]>;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(messages));
        return;
      }
      next(error);
    }
  };
}