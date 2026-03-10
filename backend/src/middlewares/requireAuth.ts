import type { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import prisma from '../config/db';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'No autorizado, token faltante');
    return;
  }

  const token = authHeader.slice(7);
  if (!token) {
    sendError(res, 401, 'No autorizado, token inválido');
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, updatedAt: true },
    });

    if (!user) {
      sendError(res, 401, 'No autorizado, token inválido o usuario inexistente');
      return;
    }

    if (payload.sessionIssuedAt < user.updatedAt.getTime()) {
      sendError(res, 401, 'No autorizado, sesión expirada. Inicia sesión nuevamente');
      return;
    }

    req.user = payload;
    Sentry.setUser({ id: payload.userId });
    next();
  } catch {
    sendError(res, 401, 'No autorizado, token inválido');
  }
};
