import { useQuery } from '@tanstack/react-query';
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/store/auth.store";
import { SyncQueueRepository } from "@/db/syncQueue.repository";

export const useSyncQueueStatus = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: queryKeys.syncQueueStatus(userId),
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
    refetchInterval: (query) => {
      const data = query.state.data as
        | {
            pendingCount: number;
            failedCount: number;
          }
        | undefined;

      if (!data) {
        return false;
      }

      return data.pendingCount > 0 || data.failedCount > 0 ? 5_000 : false;
    },
    staleTime: 2_000,
  });
};
