import type { NotificationDto } from '../dto/notification.dto';

export const mapNotificationToDto = (notification: NotificationDto): NotificationDto => ({
  id: notification.id,
  title: notification.title,
  body: notification.body,
  type: notification.type,
  status: notification.status,
  createdAt: notification.createdAt,
});

export const mapNotificationsToDto = (notifications: NotificationDto[]): NotificationDto[] => {
  return notifications.map(mapNotificationToDto);
};

