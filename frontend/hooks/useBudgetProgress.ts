import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TransactionRepository } from '../db/transaction.repository';
import { useAuthStore } from '../store/auth.store';

export const useBudgetProgress = () => {
  const userId = useAuthStore((state) => state.user?.id);

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return useQuery({
    queryKey: ['budget-progress', userId, year, month],
    queryFn: async () => {
      if (!userId) return [];
      return TransactionRepository.getMonthlyExpenseByCategory(userId, year, month);
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
};
