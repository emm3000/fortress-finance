import type { ExpoPushMessage } from 'expo-server-sdk';
import { Expo } from 'expo-server-sdk';
import prisma from '../config/db';

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

  return await prisma.userPushToken.upsert({
    where: { tokenString: token },
    create: {
      userId,
      tokenString: token,
      deviceInfo: normalizedDeviceInfo,
    },
    update: {
      userId, // Re-vincular si el token cambió de usuario (raro pero posible)
      deviceInfo: normalizedDeviceInfo,
    },
  });
};

/**
 * Remove a push token
 */
export const unregisterPushToken = async (userId: string, token: string) => {
  return await prisma.userPushToken.deleteMany({
    where: {
      userId,
      tokenString: token,
    },
  });
};

/**
 * Send push notification to all devices of a user
 */
export const sendPushNotification = async (options: SendPushOptions) => {
  const { userId, title, body, type, data, dedupeWindowMinutes } = options;

  if (typeof dedupeWindowMinutes === 'number' && dedupeWindowMinutes > 0) {
    const cutoff = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000);
    const recentDuplicate = await prisma.notificationLog.findFirst({
      where: {
        userId,
        type,
        title,
        body,
        createdAt: {
          gte: cutoff,
        },
      },
      select: { id: true },
    });

    if (recentDuplicate) {
      return;
    }
  }

  // 1. Obtener tokens del usuario
  const pushTokens = await prisma.userPushToken.findMany({
    where: { userId },
  });

  if (pushTokens.length === 0) {
    await prisma.notificationLog.create({
      data: {
        userId,
        title,
        body,
        type,
        status: 'FAILED',
      },
    });
    return;
  }

  const messages: ExpoPushMessage[] = [];
  for (const pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken.tokenString)) {
      // eslint-disable-next-line no-console
      console.error('Token inválido detectado para usuario', userId, pushToken.tokenString);
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
      // eslint-disable-next-line no-console
      console.error('Error enviando batch de notificaciones:', error);
    }
  }

  // 3. Registrar en logs (opcional, uno por intento exitoso o unificado)
  await prisma.notificationLog.create({
    data: {
      userId,
      title,
      body,
      type,
      status: tickets.length > 0 ? 'SENT' : 'FAILED',
    },
  });

  // Nota: En una app de producción real, aquí procesaríamos los 'tickets' para
  // detectar tokens que han expirado (DeviceNotRegistered) y eliminarlos de la DB.
  // Para este MVP, lanzamos y olvidamos, pero dejamos la estructura lista.
};
