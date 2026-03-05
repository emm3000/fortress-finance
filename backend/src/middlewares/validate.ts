import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError, ZodIssue } from 'zod';

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zodError = error as any;
        res.status(400).json({
          error: 'Validation Error',
          details: zodError.errors.map((e: ZodIssue) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
