import type { Response } from 'express';
import { env } from '../config/env';

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

const useEnvelope = env.API_RESPONSE_ENVELOPE;

export const sendSuccess = (
  res: Response,
  statusCode: number,
  payload: unknown,
  meta?: ApiMeta,
): void => {
  if (useEnvelope) {
    const body: ApiSuccess<unknown> = {
      data: payload,
      ...(meta ? { meta } : {}),
    };
    res.status(statusCode).json(body);
    return;
  }

  res.status(statusCode).json(payload);
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
  if (useEnvelope) {
    const body: ApiError = {
      error: {
        message,
        ...(options?.code ? { code: options.code } : {}),
        ...(typeof options?.details !== 'undefined' ? { details: options.details } : {}),
      },
    };
    res.status(statusCode).json(body);
    return;
  }

  const legacyDetails = options?.details;
  const legacyMessage =
    typeof legacyDetails === 'object' &&
    legacyDetails !== null &&
    'message' in legacyDetails &&
    typeof (legacyDetails as { message?: unknown }).message === 'string'
      ? (legacyDetails as { message: string }).message
      : undefined;

  const legacy = {
    error: message,
    ...(typeof legacyMessage !== 'undefined' ? { message: legacyMessage } : {}),
    ...(typeof options?.details !== 'undefined' && typeof legacyMessage === 'undefined'
      ? { details: options.details }
      : {}),
  };
  res.status(statusCode).json(legacy);
};
