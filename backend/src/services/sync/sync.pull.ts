import type { Prisma } from '@prisma/client';
import type { SyncPullChanges } from './sync.types';

export const pullServerChanges = async (
  tx: Prisma.TransactionClient,
  userId: string,
  lastSyncTimestamp: Date,
): Promise<SyncPullChanges> => {
  const transactions = await tx.transaction.findMany({
    where: {
      userId,
      updatedAt: { gt: lastSyncTimestamp },
    },
    orderBy: { updatedAt: 'asc' },
  });

  const budgets = await tx.budget.findMany({
    where: {
      userId,
      updatedAt: { gt: lastSyncTimestamp },
    },
    orderBy: { updatedAt: 'asc' },
  });

  const inventory = await tx.userInventory.findMany({
    where: {
      userId,
      updatedAt: { gt: lastSyncTimestamp },
    },
    include: { item: true },
    orderBy: { updatedAt: 'asc' },
  });

  const castle = await tx.castleState.findUnique({
    where: { userId },
  });

  const wallet = await tx.userWallet.findUnique({
    where: { userId },
  });

  return {
    transactions,
    budgets,
    inventory,
    castle,
    wallet,
  };
};

