import type { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { AppError } from '../utils/AppError';
import type { PushTokenInput, UnregisterTokenInput } from '../validations/notification.validation';

type RegisterTokenRequest = Request<Record<string, never>, unknown, PushTokenInput>;
type UnregisterTokenRequest = Request<Record<string, never>, unknown, UnregisterTokenInput>;

export const registerToken = async (req: RegisterTokenRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'No autorizado');

    const { token, deviceInfo } = req.body;
    await notificationService.registerPushToken(userId, token, deviceInfo);

    res.status(200).json({ message: 'Token registrado exitosamente' });
  } catch (error) {
    next(error);
  }
};

export const unregisterToken = async (
  req: UnregisterTokenRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'No autorizado');

    const { token } = req.body;
    await notificationService.unregisterPushToken(userId, token);

    res.status(200).json({ message: 'Token eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};
