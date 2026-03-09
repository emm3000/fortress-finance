import type { NotificationStatus, NotificationType } from '@prisma/client';

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: Date;
}

