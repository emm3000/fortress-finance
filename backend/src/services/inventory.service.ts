import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import type {
  EquippedInventoryDto,
  InventoryItemDto,
  PurchaseInventoryResultDto,
} from '../dto/inventory.dto';
import {
  mapEquippedInventoryToDto,
  mapInventoryListToDto,
  mapPurchaseInventoryResultToDto,
} from '../mappers/inventory.mapper';
import * as inventoryRepository from '../repositories/inventory.repository';
import { errorCatalog } from '../utils/errorCatalog';

/**
 * Get user's inventory
 */
export const getUserInventory = async (userId: string): Promise<InventoryItemDto[]> => {
  const inventory = await inventoryRepository.findInventoryWithItemsByUser(userId);

  return mapInventoryListToDto(inventory);
};

/**
 * Purchase an item from the shop
 * Reto técnico: Asegurar consistencia atómica para evitar double-spending
 */
export const purchaseItem = async (userId: string, itemId: string): Promise<PurchaseInventoryResultDto> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar si ya posee el item
      const existingOwnership = await inventoryRepository.findOwnedInventoryItem(tx, userId, itemId);

      if (existingOwnership) {
        throw errorCatalog.economy.itemAlreadyOwned();
      }

      // 2. Obtener el item y verificar precio
      const item = await inventoryRepository.findShopItemById(tx, itemId);

      if (!item) {
        throw errorCatalog.economy.itemNotFound();
      }

      // 3. Ejecutar débito atómico solo si el saldo alcanza.
      // Esto evita double-spending bajo concurrencia.
      const walletDebit = await inventoryRepository.debitWalletIfEnough(tx, userId, item.price);

      if (walletDebit.count === 0) {
        throw errorCatalog.economy.insufficientBalance();
      }

      // 4. Registrar adquisición del item
      const inventoryItem = await inventoryRepository.createUserInventoryItem(tx, userId, itemId);

      const wallet = await inventoryRepository.findWalletBalanceByUser(tx, userId);

      return {
        message: 'Compra exitosa',
        inventoryItem,
        newBalance: wallet?.goldBalance ?? 0,
      };
    });

    return mapPurchaseInventoryResultToDto(result);
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
export const toggleEquipItem = async (
  userId: string,
  inventoryId: string,
  isEquipped: boolean,
): Promise<EquippedInventoryDto> => {
  const inventoryItem = await inventoryRepository.updateInventoryEquipStatus(
    userId,
    inventoryId,
    isEquipped,
  );

  return mapEquippedInventoryToDto(inventoryItem);
};
