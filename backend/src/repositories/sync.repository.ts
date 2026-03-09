import type { Prisma } from '@prisma/client';

export const findTransactionSyncState = async (tx: Prisma.TransactionClient, transactionId: string) => {
  return tx.transaction.findUnique({
    where: { id: transactionId },
    select: { userId: true, updatedAt: true },
  });
};

export const createTransactionFromSync = async (
  tx: Prisma.TransactionClient,
  data: Prisma.TransactionUncheckedCreateInput,
) => {
  return tx.transaction.create({ data });
};

export const updateTransactionFromSync = async (
  tx: Prisma.TransactionClient,
  transactionId: string,
  data: Prisma.TransactionUncheckedUpdateInput,
) => {
  return tx.transaction.update({
    where: { id: transactionId },
    data,
  });
};

export const findBudgetSyncState = async (tx: Prisma.TransactionClient, budgetId: string) => {
  return tx.budget.findUnique({
    where: { id: budgetId },
    select: { userId: true, updatedAt: true },
  });
};

export const createBudgetFromSync = async (
  tx: Prisma.TransactionClient,
  data: Prisma.BudgetUncheckedCreateInput,
) => {
  return tx.budget.create({ data });
};

export const updateBudgetFromSync = async (
  tx: Prisma.TransactionClient,
  budgetId: string,
  data: Prisma.BudgetUncheckedUpdateInput,
) => {
  return tx.budget.update({
    where: { id: budgetId },
    data,
  });
};

export const findInventorySyncState = async (tx: Prisma.TransactionClient, inventoryId: string) => {
  return tx.userInventory.findUnique({
    where: { id: inventoryId },
    select: { userId: true, updatedAt: true },
  });
};

export const updateInventoryFromSync = async (
  tx: Prisma.TransactionClient,
  inventoryId: string,
  data: Prisma.UserInventoryUncheckedUpdateInput,
) => {
  return tx.userInventory.update({
    where: { id: inventoryId },
    data,
  });
};

export const pullTransactionsSince = async (
  tx: Prisma.TransactionClient,
  userId: string,
  lastSyncTimestamp: Date,
) => {
  return tx.transaction.findMany({
    where: {
      userId,
      updatedAt: { gt: lastSyncTimestamp },
    },
    orderBy: { updatedAt: 'asc' },
  });
};

export const pullBudgetsSince = async (
  tx: Prisma.TransactionClient,
  userId: string,
  lastSyncTimestamp: Date,
) => {
  return tx.budget.findMany({
    where: {
      userId,
      updatedAt: { gt: lastSyncTimestamp },
    },
    orderBy: { updatedAt: 'asc' },
  });
};

export const pullInventorySince = async (
  tx: Prisma.TransactionClient,
  userId: string,
  lastSyncTimestamp: Date,
) => {
  return tx.userInventory.findMany({
    where: {
      userId,
      updatedAt: { gt: lastSyncTimestamp },
    },
    include: { item: true },
    orderBy: { updatedAt: 'asc' },
  });
};

export const findCastleStateForSync = async (tx: Prisma.TransactionClient, userId: string) => {
  return tx.castleState.findUnique({
    where: { userId },
  });
};

export const findWalletForSync = async (tx: Prisma.TransactionClient, userId: string) => {
  return tx.userWallet.findUnique({
    where: { userId },
  });
};

