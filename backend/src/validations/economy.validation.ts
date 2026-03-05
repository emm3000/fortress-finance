import { z } from 'zod';

export const purchaseSchema = z.object({
  body: z.object({
    itemId: z.string().uuid('ID de objeto inválido'),
  }),
});

export const equipSchema = z.object({
  body: z.object({
    inventoryId: z.string().uuid('ID de inventario inválido'),
    isEquipped: z.boolean(),
  }),
});
