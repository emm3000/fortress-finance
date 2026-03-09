import apiClient from './api.client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'ATTACK' | 'REWARD' | 'SHOP';
  status: 'SENT' | 'FAILED';
  createdAt: string;
}

export const NotificationService = {
  async list(limit: number = 30): Promise<AppNotification[]> {
    const response = await apiClient.get<AppNotification[]>('/notifications', {
      params: { limit },
    });
    return response.data;
  },
};
