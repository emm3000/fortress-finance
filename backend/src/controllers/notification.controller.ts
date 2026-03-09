import type { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';
import type {
  NotificationListQuery,
  PushTokenInput,
  UnregisterTokenInput,
} from '../validations/notification.validation';

type RegisterTokenRequest = Request<Record<string, never>, unknown, PushTokenInput>;
type UnregisterTokenRequest = Request<Record<string, never>, unknown, UnregisterTokenInput>;

export const registerToken = asyncHandler(async (req: RegisterTokenRequest, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const { token, deviceInfo } = req.body;
  await notificationService.registerPushToken(userId, token, deviceInfo);

  res.status(200).json({ message: 'Token registrado exitosamente' });
});

export const unregisterToken = asyncHandler(async (req: UnregisterTokenRequest, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const { token } = req.body;
  await notificationService.unregisterPushToken(userId, token);

  res.status(200).json({ message: 'Token eliminado exitosamente' });
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const rawLimit = (req.query as { limit?: unknown }).limit;
  const limit = typeof rawLimit === 'number' ? rawLimit : Number(rawLimit ?? 30);
  const notifications = await notificationService.getUserNotifications(userId, limit);

  res.status(200).json(notifications);
});
