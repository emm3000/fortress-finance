import { useState, useEffect, useCallback } from "react";
import { CastleRepository, CastleState } from "../db/castle.repository";
import { useAuthStore } from "../store/auth.store";

export const useCastle = () => {
  const [castle, setCastle] = useState<CastleState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  const fetchCastle = useCallback(async () => {
    if (!user) return;
    try {
      const data = await CastleRepository.get(user.id);
      setCastle(data);
    } catch (error) {
      console.error("Failed to fetch local castle state:", error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    fetchCastle();
  }, [fetchCastle]);

  return {
    castle,
    isLoading,
    refreshCastle: fetchCastle,
  };
};
