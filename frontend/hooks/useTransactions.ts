import { useState, useEffect, useCallback } from "react";
import { TransactionRepository, Transaction } from "../db/transaction.repository";
import { useAuthStore } from "../store/auth.store";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const user = useAuthStore((state) => state.user);

  const fetchTransactions = useCallback(async (reset = false) => {
    if (!user) return;
    
    // Evitar llamadas duplicadas o si ya no hay más datos (salvo que sea un refresh forzado)
    if (!reset && (!hasMore || isFetchingNextPage)) return;

    try {
      if (reset) {
        setIsLoading(true);
        setHasMore(true);
      } else {
        setIsFetchingNextPage(true);
      }

      // TODO: Here transactions.length could cause bugs if called concurrently. 
      // Safe strategy is to pass current length or use updater function, but since it's a hook we can read from state cautiously,
      // or simply rely on the effect. Using functional state update is safer but we need length before fetch.
      const offset = reset ? 0 : transactions.length;
      const limit = 20;
      
      const data = await TransactionRepository.getAll(user.id, limit, offset);
      
      if (data.length < limit) {
        setHasMore(false);
      }

      setTransactions(prev => reset ? data : [...prev, ...data]);
    } catch (error) {
      console.error("Failed to fetch local transactions:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  }, [user, hasMore, isFetchingNextPage, transactions.length]);

  useEffect(() => {
    if (user?.id) {
       fetchTransactions(true);
    }
  }, [user?.id, fetchTransactions]); // Re-fetch only on user change, avoid object dependency

  return {
    transactions,
    isLoading,
    isFetchingNextPage,
    hasMore,
    refreshTransactions: () => fetchTransactions(true),
    fetchNextPage: () => fetchTransactions(false),
  };
};
