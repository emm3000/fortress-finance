import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from "@/store/auth.store";
import { SyncQueueRepository } from "@/db/syncQueue.repository";

export const useSyncQueueStatus = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['sync-queue-status', userId],
    queryFn: async () => {
      if (!userId) {
        return {
          pendingCount: 0,
          failedCount: 0,
          nextRetryAt: null,
          lastError: null,
        };
      }
      return SyncQueueRepository.getQueueStatus(userId);
    },
    enabled: !!userId,
    refetchInterval: 5_000,
    staleTime: 2_000,
  });
};
