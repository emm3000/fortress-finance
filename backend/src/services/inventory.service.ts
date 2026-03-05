import prisma from '../config/db';
import { AppError } from '../utils/AppError';

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
  return await prisma.$transaction(async (tx) => {
    // 1. Verificar si ya posee el item
    const existingOwnership = await tx.userInventory.findUnique({
      where: {
        userId_itemId: { userId, itemId },
      },
    });

    if (existingOwnership) {
      throw new AppError(400, 'Ya posees este objeto');
    }

    // 2. Obtener el item y verificar precio
    const item = await tx.shopItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new AppError(404, 'Objeto de tienda no encontrado');
    }

    // 3. Verificar balance del usuario
    const wallet = await tx.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.goldBalance < item.price) {
      throw new AppError(400, 'Balance de oro insuficiente');
    }

    // 4. Ejecutar la compra (Débito + Adquisición)
    await tx.userWallet.update({
      where: { userId },
      data: {
        goldBalance: { decrement: item.price },
      },
    });

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

    return {
      message: 'Compra exitosa',
      inventoryItem,
      newBalance: wallet.goldBalance - item.price,
    };
  });
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
