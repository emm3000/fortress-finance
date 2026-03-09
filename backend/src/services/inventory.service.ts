import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { errorCatalog } from '../utils/errorCatalog';

/**
 * Get user's inventory
 */
export const getUserInventory = async (userId: string) => {
  return await prisma.userInventory.findMany({
    where: { userId },
    include: {
      item: true,
    },
  });
};

/**
 * Purchase an item from the shop
 * Reto técnico: Asegurar consistencia atómica para evitar double-spending
 */
export const purchaseItem = async (userId: string, itemId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar si ya posee el item
      const existingOwnership = await tx.userInventory.findUnique({
        where: {
          userId_itemId: { userId, itemId },
        },
      });

      if (existingOwnership) {
        throw errorCatalog.economy.itemAlreadyOwned();
      }

      // 2. Obtener el item y verificar precio
      const item = await tx.shopItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw errorCatalog.economy.itemNotFound();
      }

      // 3. Ejecutar débito atómico solo si el saldo alcanza.
      // Esto evita double-spending bajo concurrencia.
      const walletDebit = await tx.userWallet.updateMany({
        where: {
          userId,
          goldBalance: { gte: item.price },
        },
        data: {
          goldBalance: { decrement: item.price },
        },
      });

      if (walletDebit.count === 0) {
        throw errorCatalog.economy.insufficientBalance();
      }

      // 4. Registrar adquisición del item
      const inventoryItem = await tx.userInventory.create({
        data: {
          userId,
          itemId,
          isEquipped: false,
        },
        include: {
          item: true,
        },
      });

      const wallet = await tx.userWallet.findUnique({
        where: { userId },
        select: { goldBalance: true },
      });

      return {
        message: 'Compra exitosa',
        inventoryItem,
        newBalance: wallet?.goldBalance ?? 0,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw errorCatalog.economy.itemAlreadyOwned();
    }

    throw error;
  }
};

/**
 * Equip or unequip an item
 */
export const toggleEquipItem = async (userId: string, inventoryId: string, isEquipped: boolean) => {
  return await prisma.userInventory.update({
    where: {
      id: inventoryId,
      userId, // Seguridad: asegurar que el item pertenece al usuario
    },
    data: {
      isEquipped,
    },
  });
};
