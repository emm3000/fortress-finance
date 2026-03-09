import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FullSyncResult, SyncService } from "../services/sync.service";
import { useAuthStore } from "../store/auth.store";

type SyncMutationResult = FullSyncResult & {
  hasCategoriesUpdate: boolean;
};

/**
 * Hook to manage the synchronization process in the UI using React Query.
 */
export const useSync = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  const syncMutation = useMutation<SyncMutationResult>({
    mutationFn: async () => {
      if (!isAuthenticated || !userId) {
        return {
          status: "success",
          syncTimestamp: "",
          hasTransactionsUpdates: false,
          hasCastleUpdate: false,
          hasCategoriesUpdate: false,
        };
      }
      // First, ensure we have categories
      const syncedCategories = await SyncService.syncCategories();
      // Then perform the full data sync
      const fullSyncResult = await SyncService.fullSync(userId);
      return {
        ...fullSyncResult,
        hasCategoriesUpdate: syncedCategories.length > 0,
      };
    },
    onSuccess: (result) => {
      if (!userId) return;
      if (result.hasTransactionsUpdates) {
        queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "monthly", userId] });
        queryClient.invalidateQueries({ queryKey: ["budget-progress", userId] });
      }
      if (result.hasCastleUpdate) {
        queryClient.invalidateQueries({ queryKey: ["castle", userId] });
      }
      if (result.hasCategoriesUpdate) {
        queryClient.invalidateQueries({ queryKey: ["categories", userId] });
      }
    },
    onError: (error) => {
      console.error("Sync error:", error);
    },
  });
  const { mutateAsync, isPending, error } = syncMutation;

  const performSync = useCallback(async () => {
    if (!isAuthenticated || !userId || isPending) return;
    try {
      await mutateAsync();
    } catch {
       // Handled in onError
    }
  }, [isAuthenticated, isPending, mutateAsync, userId]);

  return {
    performSync,
    isSyncing: isPending,
    lastSyncError: error ? (error as Error).message : null,
  };
};
