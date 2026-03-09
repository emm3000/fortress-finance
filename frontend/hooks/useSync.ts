import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SyncService } from "../services/sync.service";
import { useAuthStore } from "../store/auth.store";

/**
 * Hook to manage the synchronization process in the UI using React Query.
 */
export const useSync = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !userId) return;
      // First, ensure we have categories
      await SyncService.syncCategories();
      // Then perform the full data sync
      await SyncService.fullSync(userId);
    },
    onSuccess: () => {
      // Invalidate relevant queries when sync completes to refresh UI
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['castle'] }); 
    },
    onError: (error) => {
      console.error("Sync error:", error);
    }
  });

  const performSync = useCallback(async () => {
    if (!isAuthenticated || !userId || syncMutation.isPending) return;
    try {
      await syncMutation.mutateAsync();
    } catch {
       // Handled in onError
    }
  }, [isAuthenticated, userId, syncMutation]);

  return {
    performSync,
    isSyncing: syncMutation.isPending,
    lastSyncError: syncMutation.error ? (syncMutation.error as Error).message : null,
  };
};
