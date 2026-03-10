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
 * Technical focus: enforce atomic consistency to prevent double-spending
 */
export const purchaseItem = async (userId: string, itemId: string): Promise<PurchaseInventoryResultDto> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check whether user already owns this item
      const existingOwnership = await inventoryRepository.findOwnedInventoryItem(tx, userId, itemId);

      if (existingOwnership) {
        throw errorCatalog.economy.itemAlreadyOwned();
      }

      // 2. Fetch item and validate price
      const item = await inventoryRepository.findShopItemById(tx, itemId);

      if (!item) {
        throw errorCatalog.economy.itemNotFound();
      }

      // 3. Perform atomic debit only when balance is sufficient.
      // This prevents double-spending under concurrent requests.
      const walletDebit = await inventoryRepository.debitWalletIfEnough(tx, userId, item.price);

      if (walletDebit.count === 0) {
        throw errorCatalog.economy.insufficientBalance();
      }

      // 4. Persist inventory acquisition
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
