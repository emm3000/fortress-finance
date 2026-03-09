import { z } from 'zod';

export const purchaseSchema = z.object({
  body: z.object({
    itemId: z.uuid('ID de objeto inválido'),
  }),
});

export const equipSchema = z.object({
  body: z.object({
    inventoryId: z.uuid('ID de inventario inválido'),
    isEquipped: z.boolean(),
  }),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>['body'];
export type EquipInput = z.infer<typeof equipSchema>['body'];
