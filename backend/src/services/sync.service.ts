import prisma from '../config/db';
import type { SyncBody } from '../validations/sync.validation';
import { AppError } from '../utils/AppError';

export const synchronize = async (userId: string, data: SyncBody) => {
  const { lastSyncTimestamp, transactions, budgets, inventory } = data;

  // Execute PUSH and PULL atomically to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    // --- 1. PUSH: Guardar cambios provenientes de la App ---

    // Transactions PUSH
    if (transactions.length > 0) {
      for (const t of transactions) {
        const existing = await tx.transaction.findUnique({
          where: { id: t.id },
          select: { userId: true, updatedAt: true },
        });

        if (existing && existing.userId !== userId) {
          throw new AppError(403, 'No autorizado para modificar esta transacción');
        }

        if (!existing) {
          await tx.transaction.create({
            data: {
              id: t.id,
              userId,
              amount: t.amount,
              type: t.type,
              categoryId: t.categoryId,
              date: t.date,
              notes: t.notes ?? null,
              updatedAt: t.updatedAt,
              deletedAt: t.deletedAt,
            },
          });
          continue;
        }

        const existingUpdatedAt = existing.updatedAt.getTime();
        const incomingUpdatedAt = t.updatedAt.getTime();
        if (incomingUpdatedAt < existingUpdatedAt) {
          continue;
        }

        await tx.transaction.update({
          where: { id: t.id },
          data: {
            amount: t.amount,
            type: t.type,
            categoryId: t.categoryId,
            date: t.date,
            notes: t.notes ?? null,
            updatedAt: t.updatedAt,
            deletedAt: t.deletedAt,
          },
        });
      }
    }

    // Budgets PUSH
    if (budgets.length > 0) {
      for (const b of budgets) {
        const existing = await tx.budget.findUnique({
          where: { id: b.id },
          select: { userId: true, updatedAt: true },
        });

        if (existing && existing.userId !== userId) {
          throw new AppError(403, 'No autorizado para modificar este presupuesto');
        }

        if (!existing) {
          await tx.budget.create({
            data: {
              id: b.id,
              userId,
              categoryId: b.categoryId,
              limitAmount: b.limitAmount,
              period: b.period,
              updatedAt: b.updatedAt,
            },
          });
          continue;
        }

        const existingUpdatedAt = existing.updatedAt.getTime();
        const incomingUpdatedAt = b.updatedAt.getTime();
        if (incomingUpdatedAt < existingUpdatedAt) {
          continue;
        }

        await tx.budget.update({
          where: { id: b.id },
          data: {
            limitAmount: b.limitAmount,
            period: b.period,
            updatedAt: b.updatedAt,
          },
        });
      }
    }

    // Inventory PUSH (Solo permitimos sincronizar isEquipped)
    if (inventory.length > 0) {
      await Promise.all(
        inventory.map((inv) =>
          tx.userInventory.findUnique({ where: { id: inv.id }, select: { userId: true, updatedAt: true } }).then(
            async (existingInventory) => {
              if (existingInventory?.userId !== userId) {
                return;
              }
              if (inv.updatedAt.getTime() < existingInventory.updatedAt.getTime()) {
                return;
              }
              await tx.userInventory.update({
                where: { id: inv.id },
                data: {
                  isEquipped: inv.isEquipped,
                  updatedAt: inv.updatedAt,
                },
              });
            },
          ),
        ),
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

    const inventoryPull = await tx.userInventory.findMany({
      where: {
        userId,
        updatedAt: { gt: lastSyncTimestamp },
      },
      include: { item: true },
      orderBy: { updatedAt: 'asc' },
    });

    const castlePull = await tx.castleState.findUnique({
      where: { userId },
    });

    const walletPull = await tx.userWallet.findUnique({
      where: { userId },
    });

    return {
      syncTimestamp: now.toISOString(),
      changes: {
        transactions: transactionsPull,
        budgets: budgetsPull,
        inventory: inventoryPull,
        castle: castlePull,
        wallet: walletPull,
      },
    };
  });

  return result;
};
