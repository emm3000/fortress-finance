import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // eslint-disable-next-line no-console
  console.error('[Error Handler]:', err);

  if (err instanceof PrismaClientKnownRequestError) {
    // Handling Prisma specific errors
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Data collision. A unique constraint failed.', details: err.meta });
      return;
    }
    res.status(400).json({ error: 'Bad Request due to database conflict', code: err.code });
    return;
  }

  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  res.status(500).json({ error: 'Internal Server Error', message: errorMessage });
};
