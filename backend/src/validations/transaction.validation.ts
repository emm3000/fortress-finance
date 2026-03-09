import { z } from 'zod';

export const transactionIdParamSchema = z.object({
  params: z.object({
    id: z.uuid('ID de transacción inválido'),
  }),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive('El monto debe ser mayor a 0'),
    type: z.enum(['INCOME', 'EXPENSE']),
    categoryId: z.uuid('ID de categoría inválido'),
    date: z.iso
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .transform((value) => new Date(value)),
    notes: z.string().max(200).optional().nullable(),
  }),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>['body'];
