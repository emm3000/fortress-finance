import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from "@/store/auth.store";
import { BudgetService } from "@/services/budget.service";
import { useNetworkStore } from "@/store/network.store";

export const useBudgets = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ['budgets', userId],
    queryFn: () => BudgetService.getCachedOrRemote(userId!, isOnline),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: { categoryId: string; limitAmount: number; period?: 'MONTHLY' }) => {
      if (!isOnline) {
        throw new Error('Sin internet. No se puede guardar presupuesto en este momento.');
      }
      if (!userId) {
        throw new Error('Sesion no disponible. Inicia sesion nuevamente.');
      }
      return BudgetService.upsert(userId, input);
    },
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
