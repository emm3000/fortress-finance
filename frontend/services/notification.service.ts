import apiClient from './api.client';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'ATTACK' | 'REWARD' | 'SHOP';
  status: 'SENT' | 'FAILED';
  createdAt: string;
}

const PUSH_TOKEN_KEY = 'expo_push_token';
const PUSH_TOKEN_OWNER_KEY = 'expo_push_token_owner';
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;

const getDeviceInfo = () => `${Platform.OS}:${String(Platform.Version ?? 'unknown')}`;

const loadNotificationsModule = async () => {
  if (Platform.OS === 'web' || isExpoGo) {
    return null;
  }

  return import('expo-notifications');
};

export const NotificationService = {
  async list(limit: number = 30): Promise<AppNotification[]> {
    const response = await apiClient.get<AppNotification[]>('/notifications', {
      params: { limit },
    });
    return response.data;
  },

  async ensurePushTokenRegistered(userId: string): Promise<string | null> {
    const Notifications = await loadNotificationsModule();

    if (!Notifications) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (finalStatus !== 'granted') {
      const permissionResponse = await Notifications.requestPermissionsAsync();
      finalStatus = permissionResponse.status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = getProjectId();
    if (!projectId) {
      console.warn('No se encontró projectId de EAS; se omite registro de push token.');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenResponse.data;
    const [storedToken, storedOwner] = await Promise.all([
      SecureStore.getItemAsync(PUSH_TOKEN_KEY),
      SecureStore.getItemAsync(PUSH_TOKEN_OWNER_KEY),
    ]);

    if (storedToken === pushToken && storedOwner === userId) {
      return pushToken;
    }

    await apiClient.post('/notifications/register', {
      token: pushToken,
      deviceInfo: getDeviceInfo(),
    });

    await Promise.all([
      SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken),
      SecureStore.setItemAsync(PUSH_TOKEN_OWNER_KEY, userId),
    ]);

    return pushToken;
  },

  async unregisterCurrentToken(): Promise<void> {
    const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!pushToken) {
      return;
    }

    try {
      await apiClient.post('/notifications/unregister', { token: pushToken });
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(PUSH_TOKEN_KEY),
        SecureStore.deleteItemAsync(PUSH_TOKEN_OWNER_KEY),
      ]);
    }
  },
};
