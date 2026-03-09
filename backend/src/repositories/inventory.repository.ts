import type { Prisma } from '@prisma/client';
import prisma from '../config/db';

export const findInventoryWithItemsByUser = async (userId: string) => {
  return prisma.userInventory.findMany({
    where: { userId },
    include: {
      item: true,
    },
  });
};

export const findOwnedInventoryItem = async (
  tx: Prisma.TransactionClient,
  userId: string,
  itemId: string,
) => {
  return tx.userInventory.findUnique({
    where: {
      userId_itemId: { userId, itemId },
    },
  });
};

export const findShopItemById = async (tx: Prisma.TransactionClient, itemId: string) => {
  return tx.shopItem.findUnique({
    where: { id: itemId },
  });
};

export const debitWalletIfEnough = async (
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
) => {
  return tx.userWallet.updateMany({
    where: {
      userId,
      goldBalance: { gte: amount },
    },
    data: {
      goldBalance: { decrement: amount },
    },
  });
};

export const createUserInventoryItem = async (
  tx: Prisma.TransactionClient,
  userId: string,
  itemId: string,
) => {
  return tx.userInventory.create({
    data: {
      userId,
      itemId,
      isEquipped: false,
    },
    include: {
      item: true,
    },
  });
};

export const findWalletBalanceByUser = async (tx: Prisma.TransactionClient, userId: string) => {
  return tx.userWallet.findUnique({
    where: { userId },
    select: { goldBalance: true },
  });
};

export const updateInventoryEquipStatus = async (userId: string, inventoryId: string, isEquipped: boolean) => {
  return prisma.userInventory.update({
    where: {
      id: inventoryId,
      userId,
    },
    data: {
      isEquipped,
    },
  });
};
