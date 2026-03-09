import type { EquippedInventoryDto, InventoryItemDto, PurchaseInventoryResultDto } from '../dto/inventory.dto';

export const mapInventoryItemToDto = (inventoryItem: InventoryItemDto): InventoryItemDto => ({
  ...inventoryItem,
  item: {
    ...inventoryItem.item,
  },
});

export const mapInventoryListToDto = (inventory: InventoryItemDto[]): InventoryItemDto[] => {
  return inventory.map(mapInventoryItemToDto);
};

export const mapEquippedInventoryToDto = (inventory: EquippedInventoryDto): EquippedInventoryDto => ({
  ...inventory,
});

export const mapPurchaseInventoryResultToDto = (
  result: PurchaseInventoryResultDto,
): PurchaseInventoryResultDto => ({
  message: result.message,
  inventoryItem: mapInventoryItemToDto(result.inventoryItem),
  newBalance: result.newBalance,
});

