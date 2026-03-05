import { z } from 'zod';

const transactionSyncSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().or(z.string().regex(/^\d+(\.\d{1,2})?$/)).transform(v => v.toString()),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().uuid(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform(v => new Date(v)),
  notes: z.string().optional().nullable(),
  updatedAt: z.string().datetime().transform(v => new Date(v)),
  deletedAt: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : null),
});

const budgetSyncSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  limitAmount: z.number().positive(),
  period: z.enum(['MONTHLY']).default('MONTHLY'),
  updatedAt: z.string().datetime().transform((v) => new Date(v)),
});

const inventorySyncSchema = z.object({
  id: z.string().uuid(),
  isEquipped: z.boolean(),
  updatedAt: z.string().datetime().transform((v) => new Date(v)),
});

export const syncSchema = z.object({
  body: z.object({
    lastSyncTimestamp: z
      .string()
      .datetime()
      .optional()
      .nullable()
      .transform((v) => (v ? new Date(v) : new Date(0))),
    transactions: z.array(transactionSyncSchema),
    budgets: z.array(budgetSyncSchema).optional().default([]),
    inventory: z.array(inventorySyncSchema).optional().default([]), // Solo para sincronizar isEquipped
  }),
});

export type SyncBody = z.infer<typeof syncSchema>['body'];
export type TransactionSyncInput = z.infer<typeof transactionSyncSchema>;
export type BudgetSyncInput = z.infer<typeof budgetSyncSchema>;
export type InventorySyncInput = z.infer<typeof inventorySyncSchema>;


