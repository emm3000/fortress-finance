import type { Request } from 'express';
import { errorCatalog } from './errorCatalog';

export const getUserIdOrThrow = (
  req: Request,
  message = 'Usuario no identificado',
): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw errorCatalog.auth.unauthorized(message);
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
    throw errorCatalog.request.invalidParam(message);
  }
  return value;
};
