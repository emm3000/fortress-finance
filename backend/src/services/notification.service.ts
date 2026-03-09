import type { ExpoPushMessage } from 'expo-server-sdk';
import { Expo } from 'expo-server-sdk';
import type { NotificationDto } from '../dto/notification.dto';
import { mapNotificationsToDto } from '../mappers/notification.mapper';
import * as notificationRepository from '../repositories/notification.repository';
import { logger } from '../utils/logger';

const expo = new Expo();

export interface SendPushOptions {
  userId: string;
  title: string;
  body: string;
  type: 'ATTACK' | 'REWARD' | 'SHOP';
  data?: object;
  dedupeWindowMinutes?: number;
}

/**
 * Register or update a push token for a user
 */
export const registerPushToken = async (userId: string, token: string, deviceInfo?: string) => {
  const normalizedDeviceInfo = deviceInfo ?? null;

  return notificationRepository.upsertPushToken(userId, token, normalizedDeviceInfo);
};

/**
 * Remove a push token
 */
export const unregisterPushToken = async (userId: string, token: string) => {
  return notificationRepository.deletePushTokenByUser(userId, token);
};

export const getUserNotifications = async (userId: string, limit = 30): Promise<NotificationDto[]> => {
  const notifications = await notificationRepository.findUserNotifications(userId, limit);

  return mapNotificationsToDto(notifications);
};

/**
 * Send push notification to all devices of a user
 */
export const sendPushNotification = async (options: SendPushOptions) => {
  const { userId, title, body, type, data, dedupeWindowMinutes } = options;

  if (typeof dedupeWindowMinutes === 'number' && dedupeWindowMinutes > 0) {
    const cutoff = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000);
    const recentDuplicate = await notificationRepository.findRecentDuplicateNotification({
      userId,
      type,
      title,
      body,
      fromDate: cutoff,
    });

    if (recentDuplicate) {
      return;
    }
  }

  // 1. Obtener tokens del usuario
  const pushTokens = await notificationRepository.findUserPushTokens(userId);

  if (pushTokens.length === 0) {
    await notificationRepository.createNotificationLog({
      userId,
      title,
      body,
      type,
      status: 'FAILED',
    });
    return;
  }

  const messages: ExpoPushMessage[] = [];
  for (const pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken.tokenString)) {
      logger.warn('Invalid expo push token detected', {
        userId,
        token: pushToken.tokenString,
      });
      continue;
    }

    messages.push({
      to: pushToken.tokenString,
      sound: 'default',
      title,
      body,
      data: { ...data, type },
    });
  }

  // 2. Enviar notificaciones en batches (Expo recomienda batches)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      logger.error('Failed to send push notification chunk', { userId, error });
    }
  }

  // 3. Registrar en logs (opcional, uno por intento exitoso o unificado)
  await notificationRepository.createNotificationLog({
    userId,
    title,
    body,
    type,
    status: tickets.length > 0 ? 'SENT' : 'FAILED',
  });

  // Nota: En una app de producción real, aquí procesaríamos los 'tickets' para
  // detectar tokens que han expirado (DeviceNotRegistered) y eliminarlos de la DB.
  // Para este MVP, lanzamos y olvidamos, pero dejamos la estructura lista.
};
