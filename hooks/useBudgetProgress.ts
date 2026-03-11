import { useQuery } from '@tanstack/react-query';
import { queryKeys } from "@/constants/query-keys";
import { TransactionRepository } from "@/db/transaction.repository";
import { useAuthStore } from "@/store/auth.store";
import { useCurrentPeriod } from "@/hooks/useCurrentPeriod";

export const useBudgetProgress = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const { year, month } = useCurrentPeriod();

  return useQuery({
    queryKey: queryKeys.budgetProgress(userId, year, month),
    queryFn: async () => {
      if (!userId) return [];
      return TransactionRepository.getMonthlyExpenseByCategory(userId, year, month);
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
};
