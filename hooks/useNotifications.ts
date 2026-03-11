import { useQuery } from '@tanstack/react-query';
import { queryKeys } from "@/constants/query-keys";
import { NotificationService } from "@/services/notification.service";
import { useAuthStore } from "@/store/auth.store";
import { useNetworkStore } from "@/store/network.store";

export const useNotifications = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => NotificationService.list(40),
    enabled: !!userId && isOnline,
    staleTime: 1000 * 30,
  });
};
