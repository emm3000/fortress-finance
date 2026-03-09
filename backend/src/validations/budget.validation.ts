import { z } from 'zod';

export const budgetSchema = z.object({
  body: z.object({
    categoryId: z.uuid('ID de categoría inválido'),
    limitAmount: z.number().positive('El límite debe ser un número positivo'),
    period: z.enum(['MONTHLY']).default('MONTHLY'),
  }),
});

export type BudgetInput = z.infer<typeof budgetSchema>['body'];
