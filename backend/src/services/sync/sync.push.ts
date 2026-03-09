import type { Prisma } from '@prisma/client';
import * as syncRepository from '../../repositories/sync.repository';
import { errorCatalog } from '../../utils/errorCatalog';
import type { BudgetSyncInput, InventorySyncInput, TransactionSyncInput } from '../../validations/sync.validation';
import type { SyncPushPayload } from './sync.types';

const isIncomingOlder = (incoming: Date, current: Date) => incoming.getTime() < current.getTime();

const toTransactionCreateData = (userId: string, transaction: TransactionSyncInput) => ({
  id: transaction.id,
  userId,
  amount: transaction.amount,
  type: transaction.type,
  categoryId: transaction.categoryId,
  date: transaction.date,
  notes: transaction.notes ?? null,
  updatedAt: transaction.updatedAt,
  deletedAt: transaction.deletedAt,
});

const toTransactionUpdateData = (transaction: TransactionSyncInput) => ({
  amount: transaction.amount,
  type: transaction.type,
  categoryId: transaction.categoryId,
  date: transaction.date,
  notes: transaction.notes ?? null,
  updatedAt: transaction.updatedAt,
  deletedAt: transaction.deletedAt,
});

const applyTransactionPush = async (
  tx: Prisma.TransactionClient,
  userId: string,
  transaction: TransactionSyncInput,
) => {
  const existing = await syncRepository.findTransactionSyncState(tx, transaction.id);

  if (existing && existing.userId !== userId) {
    throw errorCatalog.resource.forbidden('No autorizado para modificar esta transacción');
  }

  if (!existing) {
    await syncRepository.createTransactionFromSync(tx, toTransactionCreateData(userId, transaction));
    return;
  }

  if (isIncomingOlder(transaction.updatedAt, existing.updatedAt)) {
    return;
  }

  await syncRepository.updateTransactionFromSync(tx, transaction.id, toTransactionUpdateData(transaction));
};

const applyBudgetPush = async (tx: Prisma.TransactionClient, userId: string, budget: BudgetSyncInput) => {
  const existing = await syncRepository.findBudgetSyncState(tx, budget.id);

  if (existing && existing.userId !== userId) {
    throw errorCatalog.resource.forbidden('No autorizado para modificar este presupuesto');
  }

  if (!existing) {
    await syncRepository.createBudgetFromSync(tx, {
      id: budget.id,
      userId,
      categoryId: budget.categoryId,
      limitAmount: budget.limitAmount,
      period: budget.period,
      updatedAt: budget.updatedAt,
    });
    return;
  }

  if (isIncomingOlder(budget.updatedAt, existing.updatedAt)) {
    return;
  }

  await syncRepository.updateBudgetFromSync(tx, budget.id, {
    limitAmount: budget.limitAmount,
    period: budget.period,
    updatedAt: budget.updatedAt,
  });
};

const applyInventoryPush = async (
  tx: Prisma.TransactionClient,
  userId: string,
  inventoryItem: InventorySyncInput,
) => {
  const existingInventory = await syncRepository.findInventorySyncState(tx, inventoryItem.id);

  // Ignore unknown or non-owned inventory records to avoid leaking existence.
  if (existingInventory?.userId !== userId) {
    return;
  }

  if (isIncomingOlder(inventoryItem.updatedAt, existingInventory.updatedAt)) {
    return;
  }

  await syncRepository.updateInventoryFromSync(tx, inventoryItem.id, {
    isEquipped: inventoryItem.isEquipped,
    updatedAt: inventoryItem.updatedAt,
  });
};

export const applyPushChanges = async (tx: Prisma.TransactionClient, userId: string, payload: SyncPushPayload) => {
  for (const transaction of payload.transactions) {
    await applyTransactionPush(tx, userId, transaction);
  }

  for (const budget of payload.budgets) {
    await applyBudgetPush(tx, userId, budget);
  }

  // Inventory PUSH (only isEquipped is synchronized from client)
  for (const inventoryItem of payload.inventory) {
    await applyInventoryPush(tx, userId, inventoryItem);
  }
};
