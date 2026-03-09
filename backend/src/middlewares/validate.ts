import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { z } from 'zod';
import { sendError } from '../utils/response';

interface ValidationResult {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
}

export const validate =
  (schema: z.ZodType<ValidationResult>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body as unknown,
        query: req.query as unknown,
        params: req.params as unknown,
      });

      // Reassign body (typically safe)
      if (typeof parsed.body !== 'undefined') {
        req.body = parsed.body;
      }

      // For query and params, we merge values into existing objects to avoid getter issues
      if (parsed.query) {
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params) {
        Object.assign(req.params, parsed.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation Error', {
          details: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
