import type { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isProduction = env.NODE_ENV === 'production';

  // eslint-disable-next-line no-console
  console.error('[Error Handler]:', err);

  // Handle semantic application errors (401, 409, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    // Handling Prisma specific errors
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Conflicto de datos. Ya existe un registro con esos valores.' });
      return;
    }
    res.status(400).json({ error: 'Solicitud inválida por conflicto en base de datos.' });
    return;
  }

  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  if (isProduction) {
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error', message: errorMessage });
};
