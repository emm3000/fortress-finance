import prisma from '../config/db';
import type { Prisma } from '@prisma/client';
import type {
  BudgetSyncInput,
  InventorySyncInput,
  SyncBody,
  TransactionSyncInput,
} from '../validations/sync.validation';
import { errorCatalog } from '../utils/errorCatalog';

const isIncomingOlder = (incoming: Date, current: Date) => incoming.getTime() < current.getTime();

const applyTransactionPush = async (
  tx: Prisma.TransactionClient,
  userId: string,
  transaction: TransactionSyncInput,
) => {
  const existing = await tx.transaction.findUnique({
    where: { id: transaction.id },
    select: { userId: true, updatedAt: true },
  });

  if (existing && existing.userId !== userId) {
    throw errorCatalog.resource.forbidden('No autorizado para modificar esta transacción');
  }

  if (!existing) {
    await tx.transaction.create({
      data: {
        id: transaction.id,
        userId,
        amount: transaction.amount,
        type: transaction.type,
        categoryId: transaction.categoryId,
        date: transaction.date,
        notes: transaction.notes ?? null,
        updatedAt: transaction.updatedAt,
        deletedAt: transaction.deletedAt,
      },
    });
    return;
  }

  if (isIncomingOlder(transaction.updatedAt, existing.updatedAt)) {
    return;
  }

  await tx.transaction.update({
    where: { id: transaction.id },
    data: {
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      date: transaction.date,
      notes: transaction.notes ?? null,
      updatedAt: transaction.updatedAt,
      deletedAt: transaction.deletedAt,
    },
  });
};

const applyBudgetPush = async (tx: Prisma.TransactionClient, userId: string, budget: BudgetSyncInput) => {
  const existing = await tx.budget.findUnique({
    where: { id: budget.id },
    select: { userId: true, updatedAt: true },
  });

  if (existing && existing.userId !== userId) {
    throw errorCatalog.resource.forbidden('No autorizado para modificar este presupuesto');
  }

  if (!existing) {
    await tx.budget.create({
      data: {
        id: budget.id,
        userId,
        categoryId: budget.categoryId,
        limitAmount: budget.limitAmount,
        period: budget.period,
        updatedAt: budget.updatedAt,
      },
    });
    return;
  }

  if (isIncomingOlder(budget.updatedAt, existing.updatedAt)) {
    return;
  }

  await tx.budget.update({
    where: { id: budget.id },
    data: {
      limitAmount: budget.limitAmount,
      period: budget.period,
      updatedAt: budget.updatedAt,
    },
  });
};

const applyInventoryPush = async (
  tx: Prisma.TransactionClient,
  userId: string,
  inventoryItem: InventorySyncInput,
) => {
  const existingInventory = await tx.userInventory.findUnique({
    where: { id: inventoryItem.id },
    select: { userId: true, updatedAt: true },
  });

  // Ignore unknown or non-owned inventory records to avoid leaking existence.
  if (existingInventory?.userId !== userId) {
    return;
  }

  if (isIncomingOlder(inventoryItem.updatedAt, existingInventory.updatedAt)) {
    return;
  }

  await tx.userInventory.update({
    where: { id: inventoryItem.id },
    data: {
      isEquipped: inventoryItem.isEquipped,
      updatedAt: inventoryItem.updatedAt,
    },
  });
};

const pullServerChanges = async (tx: Prisma.TransactionClient, userId: string, lastSyncTimestamp: Date) => {
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

export const synchronize = async (userId: string, data: SyncBody) => {
  const { lastSyncTimestamp, transactions, budgets, inventory } = data;

  // Execute PUSH and PULL atomically to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    for (const transaction of transactions) {
      await applyTransactionPush(tx, userId, transaction);
    }

    for (const budget of budgets) {
      await applyBudgetPush(tx, userId, budget);
    }

    // Inventory PUSH (only isEquipped is synchronized from client)
    for (const inventoryItem of inventory) {
      await applyInventoryPush(tx, userId, inventoryItem);
    }

    const now = new Date();
    const pulledChanges = await pullServerChanges(tx, userId, lastSyncTimestamp);

    return {
      syncTimestamp: now.toISOString(),
      changes: {
        transactions: pulledChanges.transactions,
        budgets: pulledChanges.budgets,
        inventory: pulledChanges.inventory,
        castle: pulledChanges.castle,
        wallet: pulledChanges.wallet,
      },
    };
  });

  return result;
};
