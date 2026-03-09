import { useQuery } from '@tanstack/react-query';
import { NotificationService } from '../services/notification.service';
import { useAuthStore } from '../store/auth.store';

export const useNotifications = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => NotificationService.list(40),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
};
