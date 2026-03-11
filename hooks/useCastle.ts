import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { CastleRepository, CastleState } from "@/db/castle.repository";
import { useAuthStore } from "@/store/auth.store";

export const useCastle = () => {
  const userId = useAuthStore((state) => state.user?.id);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery<CastleState | null>({
    queryKey: ["castle", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await CastleRepository.get(userId);
    },
    enabled: !!userId,
  });

  const refreshCastle = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    castle: data ?? null,
    isLoading,
    refreshCastle,
  };
};
