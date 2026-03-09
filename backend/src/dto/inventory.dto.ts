import type { Prisma, UserInventory } from '@prisma/client';

export type InventoryItemDto = Prisma.UserInventoryGetPayload<{ include: { item: true } }>;

export type EquippedInventoryDto = UserInventory;

export interface PurchaseInventoryResultDto {
  message: string;
  inventoryItem: InventoryItemDto;
  newBalance: number;
}

