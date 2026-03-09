import type { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isProduction = env.NODE_ENV === 'production';

  // Handle semantic application errors (401, 409, etc.)
  if (err instanceof AppError) {
    const logMeta = {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code ?? null,
      message: err.message,
    };
    if (err.statusCode >= 500) {
      logger.error('App error (server)', logMeta);
    } else {
      logger.warn('App error (client)', logMeta);
    }

    sendError(res, err.statusCode, err.message, {
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    logger.warn('Prisma known request error', {
      path: req.path,
      method: req.method,
      prismaCode: err.code,
      message: err.message,
    });

    // Handling Prisma specific errors
    if (err.code === 'P2002') {
      sendError(res, 409, 'Conflicto de datos. Ya existe un registro con esos valores.');
      return;
    }
    sendError(res, 400, 'Solicitud inválida por conflicto en base de datos.');
    return;
  }

  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  logger.error('Unhandled API error', {
    path: req.path,
    method: req.method,
    error: err,
  });

  if (isProduction) {
    sendError(res, 500, 'Internal Server Error');
    return;
  }

  sendError(res, 500, 'Internal Server Error', { details: { message: errorMessage } });
};
