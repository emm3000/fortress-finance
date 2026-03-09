import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { CastleRepository, CastleState } from "../db/castle.repository";
import { useAuthStore } from "../store/auth.store";

export const useCastle = () => {
  const user = useAuthStore((state) => state.user);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery<CastleState | null>({
    queryKey: ["castle", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await CastleRepository.get(user.id);
    },
    enabled: !!user?.id,
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
