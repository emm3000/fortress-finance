import * as Crypto from "expo-crypto";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { TransactionRepository } from "@/db/transaction.repository";
import { useSync } from "@/hooks/useSync";
import { AnalyticsService } from "@/services/analytics.service";
import { useAuthStore } from "@/store/auth.store";
import { runWhenIdle } from "@/utils/idle";

type TransactionInput = {
  analyticsDate?: string;
  amount: number;
  categoryId: string;
  date: string;
  description: string;
  type: "INCOME" | "EXPENSE";
};

const invalidateTransactionQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardMonthly(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgetProgress(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.syncQueueStatus(userId) }),
  ]);
};

const scheduleBackgroundSync = (performSync: () => Promise<void>) => {
  runWhenIdle(() => {
    performSync().catch(() => {
      // Errors are surfaced through the sync hook/UI state when relevant.
    });
  });
};

export const useCreateTransaction = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { performSync } = useSync();

  const createTransaction = useCallback(
    async (input: TransactionInput) => {
      if (!user) {
        throw new Error("Tu sesión no está disponible. Inicia sesión nuevamente.");
      }

      const now = new Date().toISOString();
      await TransactionRepository.create({
        id: Crypto.randomUUID(),
        user_id: user.id,
        category_id: input.categoryId,
        amount: input.amount,
        description: input.description,
        date: input.date,
        type: input.type,
        is_synced: 0,
        updated_at: now,
        deleted_at: null,
      });

      AnalyticsService.track("transaction_created", {
        userId: user.id,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.analyticsDate ?? input.date,
      });

      await invalidateTransactionQueries(queryClient, user.id);
      scheduleBackgroundSync(performSync);
    },
    [performSync, queryClient, user]
  );

  return {
    createTransaction,
  };
};

export const useUpdateTransaction = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { performSync } = useSync();

  const updateTransaction = useCallback(
    async (transactionId: string, input: TransactionInput) => {
      if (!user) {
        throw new Error("Tu sesión no está disponible. Inicia sesión nuevamente.");
      }

      await TransactionRepository.update(transactionId, user.id, {
        amount: input.amount,
        type: input.type,
        category_id: input.categoryId,
        description: input.description,
        date: input.date,
      });

      await invalidateTransactionQueries(queryClient, user.id);
      scheduleBackgroundSync(performSync);
    },
    [performSync, queryClient, user]
  );

  return {
    updateTransaction,
  };
};

export const useDeleteTransaction = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { performSync } = useSync();

  const deleteTransaction = useCallback(
    async (transactionId: string) => {
      if (!user) {
        throw new Error("Tu sesión no está disponible. Inicia sesión nuevamente.");
      }

      await TransactionRepository.softDelete(transactionId, user.id);
      await invalidateTransactionQueries(queryClient, user.id);
      scheduleBackgroundSync(performSync);
    },
    [performSync, queryClient, user]
  );

  return {
    deleteTransaction,
  };
};
