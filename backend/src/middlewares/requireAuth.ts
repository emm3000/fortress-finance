import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
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
    req.user = payload;
    next();
  } catch {
    sendError(res, 401, 'No autorizado, token inválido');
  }
};
