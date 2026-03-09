import type { Response } from 'express';

export interface ApiMeta {
  requestId?: string;
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export const sendSuccess = (
  res: Response,
  statusCode: number,
  payload: unknown,
  meta?: ApiMeta,
): void => {
  const body: ApiSuccess<unknown> = {
    data: payload,
    ...(meta ? { meta } : {}),
  };
  res.status(statusCode).json(body);
};

export const sendOk = (res: Response, payload: unknown, meta?: ApiMeta): void => {
  sendSuccess(res, 200, payload, meta);
};

export const sendCreated = (res: Response, payload: unknown, meta?: ApiMeta): void => {
  sendSuccess(res, 201, payload, meta);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  options?: {
    code?: string;
    details?: unknown;
  },
): void => {
  const body: ApiError = {
    error: {
      message,
      ...(options?.code ? { code: options.code } : {}),
      ...(typeof options?.details !== 'undefined' ? { details: options.details } : {}),
    },
  };
  res.status(statusCode).json(body);
};
