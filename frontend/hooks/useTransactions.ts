import { useState, useEffect, useCallback } from "react";
import { TransactionRepository, Transaction } from "../db/transaction.repository";
import { useAuthStore } from "../store/auth.store";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await TransactionRepository.getAll(user.id);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch local transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    refreshTransactions: fetchTransactions,
  };
};
