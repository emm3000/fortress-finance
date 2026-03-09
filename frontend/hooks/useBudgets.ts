import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { BudgetService } from '../services/budget.service';

export const useBudgets = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ['budgets', userId],
    queryFn: () => BudgetService.getAll(),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });

  const upsertMutation = useMutation({
    mutationFn: (input: { categoryId: string; limitAmount: number; period?: 'MONTHLY' }) =>
      BudgetService.upsert(input),
    onSuccess: async () => {
      if (!userId) return;
      await queryClient.invalidateQueries({ queryKey: ['budgets', userId] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'monthly', userId] });
    },
  });

  return {
    ...budgetsQuery,
    upsertBudget: upsertMutation.mutateAsync,
    isSavingBudget: upsertMutation.isPending,
  };
};
