import { useState } from "react";
import { SyncService } from "../services/sync.service";
import { useAuthStore } from "../store/auth.store";

/**
 * Hook to manage the synchronization process in the UI.
 */
export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const performSync = async () => {
    if (!isAuthenticated || isSyncing) return;

    setIsSyncing(true);
    setLastSyncError(null);

    try {
      // First, ensure we have categories
      await SyncService.syncCategories();
      
      // Then perform the full data sync
      await SyncService.fullSync();
      
      console.log("Synchronization complete! 🔄");
    } catch (error: any) {
      setLastSyncError(error.message || "Sync failed");
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    performSync,
    isSyncing,
    lastSyncError,
  };
};
