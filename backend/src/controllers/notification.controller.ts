import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { AppError } from '../utils/AppError';

export const registerToken = async (req: Request, res: Response, next: NextFunction) => {
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

export const unregisterToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    await notificationService.unregisterPushToken(token);

    res.status(200).json({ message: 'Token eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};
