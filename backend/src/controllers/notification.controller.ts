import type { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';
import { parseBoundedInt } from '../utils/pagination';
import { sendOk } from '../utils/response';
import type {
  PushTokenInput,
  UnregisterTokenInput,
} from '../validations/notification.validation';

type RegisterTokenRequest = Request<Record<string, never>, unknown, PushTokenInput>;
type UnregisterTokenRequest = Request<Record<string, never>, unknown, UnregisterTokenInput>;

export const registerToken = asyncHandler(async (req: RegisterTokenRequest, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const { token, deviceInfo } = req.body;
  await notificationService.registerPushToken(userId, token, deviceInfo);

  sendOk(res, { message: 'Token registrado exitosamente' });
});

export const unregisterToken = asyncHandler(async (req: UnregisterTokenRequest, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const { token } = req.body;
  await notificationService.unregisterPushToken(userId, token);

  sendOk(res, { message: 'Token eliminado exitosamente' });
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const rawLimit = (req.query as { limit?: unknown }).limit;
  const limit = parseBoundedInt(rawLimit, { fallback: 30, min: 1, max: 100 });
  const notifications = await notificationService.getUserNotifications(userId, limit);

  sendOk(res, notifications);
});
