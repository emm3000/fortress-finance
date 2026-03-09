import prisma from '../config/db';
import type { NotificationType, Prisma } from '@prisma/client';

export const upsertPushToken = async (userId: string, token: string, deviceInfo: string | null) => {
  return prisma.userPushToken.upsert({
    where: { tokenString: token },
    create: {
      userId,
      tokenString: token,
      deviceInfo,
    },
    update: {
      userId,
      deviceInfo,
    },
  });
};

export const deletePushTokenByUser = async (userId: string, token: string) => {
  return prisma.userPushToken.deleteMany({
    where: {
      userId,
      tokenString: token,
    },
  });
};

export const findUserNotifications = async (userId: string, limit: number) => {
  return prisma.notificationLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      status: true,
      createdAt: true,
    },
  });
};

export const findRecentDuplicateNotification = async (params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  fromDate: Date;
}) => {
  return prisma.notificationLog.findFirst({
    where: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      createdAt: {
        gte: params.fromDate,
      },
    },
    select: { id: true },
  });
};

export const findUserPushTokens = async (userId: string) => {
  return prisma.userPushToken.findMany({
    where: { userId },
  });
};

export const createNotificationLog = async (data: Prisma.NotificationLogUncheckedCreateInput) => {
  return prisma.notificationLog.create({
    data,
  });
};

