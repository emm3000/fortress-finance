import { AppError } from './AppError';

export const ErrorCode = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_EXISTS: 'AUTH_USER_EXISTS',
  AUTH_RESET_TOKEN_INVALID_OR_EXPIRED: 'AUTH_RESET_TOKEN_INVALID_OR_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  FORBIDDEN_RESOURCE_ACCESS: 'FORBIDDEN_RESOURCE_ACCESS',
  ECONOMY_ITEM_ALREADY_OWNED: 'ECONOMY_ITEM_ALREADY_OWNED',
  ECONOMY_ITEM_NOT_FOUND: 'ECONOMY_ITEM_NOT_FOUND',
  ECONOMY_INSUFFICIENT_BALANCE: 'ECONOMY_INSUFFICIENT_BALANCE',
  REQUEST_INVALID_PARAM: 'REQUEST_INVALID_PARAM',
} as const;

const createAppError = (statusCode: number, message: string, code: string) => {
  return new AppError(statusCode, message, code);
};

export const errorCatalog = {
  auth: {
    unauthorized: (message = 'Usuario no identificado') =>
      createAppError(401, message, ErrorCode.AUTH_UNAUTHORIZED),
    invalidCredentials: () =>
      createAppError(401, 'Credenciales inválidas', ErrorCode.AUTH_INVALID_CREDENTIALS),
    userExists: () => createAppError(409, 'El usuario ya existe', ErrorCode.AUTH_USER_EXISTS),
    resetTokenInvalidOrExpired: () =>
      createAppError(
        400,
        'Token inválido o expirado',
        ErrorCode.AUTH_RESET_TOKEN_INVALID_OR_EXPIRED,
      ),
  },
  resource: {
    notFound: (message: string) => createAppError(404, message, ErrorCode.RESOURCE_NOT_FOUND),
    forbidden: (message: string) => createAppError(403, message, ErrorCode.FORBIDDEN_RESOURCE_ACCESS),
  },
  economy: {
    itemAlreadyOwned: () =>
      createAppError(409, 'Ya posees este objeto', ErrorCode.ECONOMY_ITEM_ALREADY_OWNED),
    itemNotFound: () =>
      createAppError(404, 'Objeto de tienda no encontrado', ErrorCode.ECONOMY_ITEM_NOT_FOUND),
    insufficientBalance: () =>
      createAppError(400, 'Balance de oro insuficiente', ErrorCode.ECONOMY_INSUFFICIENT_BALANCE),
  },
  request: {
    invalidParam: (message: string) =>
      createAppError(400, message, ErrorCode.REQUEST_INVALID_PARAM),
  },
};
