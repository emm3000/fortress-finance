import prisma from '../config/db';
import { SyncBody } from '../validations/sync.validation';

export const synchronize = async (userId: string, data: SyncBody) => {
  const { lastSyncTimestamp, transactions, budgets } = data;

  // Execute PUSH and PULL atomically to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    // --- 1. PUSH: Guardar cambios provenientes de la App ---

    // Transactions PUSH
    if (transactions.length > 0) {
      await Promise.all(
        transactions.map((t) =>
          tx.transaction.upsert({
            where: { id: t.id },
            create: {
              id: t.id,
              userId,
              amount: t.amount,
              type: t.type,
              categoryId: t.categoryId,
              date: t.date,
              notes: t.notes,
              updatedAt: t.updatedAt,
              deletedAt: t.deletedAt,
            },
            update: {
              amount: t.amount,
              type: t.type,
              categoryId: t.categoryId,
              date: t.date,
              notes: t.notes,
              updatedAt: t.updatedAt,
              deletedAt: t.deletedAt,
            },
          })
        )
      );
    }

    // Budgets PUSH
    if (budgets && budgets.length > 0) {
      await Promise.all(
        budgets.map((b) =>
          tx.budget.upsert({
            where: { id: b.id },
            create: {
              id: b.id,
              userId,
              categoryId: b.categoryId,
              limitAmount: b.limitAmount,
              period: b.period,
              updatedAt: b.updatedAt,
            },
            update: {
              limitAmount: b.limitAmount,
              period: b.period,
              updatedAt: b.updatedAt,
            },
          })
        )
      );
    }

    // --- 2. PULL: Leer cambios del servidor ---
    const now = new Date();

    const transactionsPull = await tx.transaction.findMany({
      where: {
        userId,
        updatedAt: { gt: lastSyncTimestamp },
      },
      orderBy: { updatedAt: 'asc' },
    });

    const budgetsPull = await tx.budget.findMany({
      where: {
        userId,
        updatedAt: { gt: lastSyncTimestamp },
      },
      orderBy: { updatedAt: 'asc' },
    });

    const castlePull = await tx.castleState.findUnique({
      where: { userId },
    });

    return {
      syncTimestamp: now.toISOString(),
      changes: {
        transactions: transactionsPull,
        budgets: budgetsPull,
        castle: castlePull,
      },
    };
  });

  return result;
};


