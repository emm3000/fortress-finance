import type { Request } from 'express';
import { AppError } from './AppError';

export const getUserIdOrThrow = (
  req: Request,
  message = 'Usuario no identificado',
): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(401, message);
  }
  return userId;
};

export const getStringParamOrThrow = (
  req: Request,
  paramName: string,
  message = `Parámetro inválido: ${paramName}`,
): string => {
  const value = req.params[paramName];
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError(400, message);
  }
  return value;
};
