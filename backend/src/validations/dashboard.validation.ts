import { z } from 'zod';

const yearSchema = z
  .string()
  .regex(/^\d{4}$/)
  .transform((value) => Number(value))
  .refine((value) => value >= 2000 && value <= 2100, 'Año fuera de rango');

const monthSchema = z
  .string()
  .regex(/^\d{1,2}$/)
  .transform((value) => Number(value))
  .refine((value) => value >= 1 && value <= 12, 'Mes inválido');

export const monthlyDashboardQuerySchema = z.object({
  query: z.object({
    year: yearSchema.optional(),
    month: monthSchema.optional(),
  }),
});

export interface MonthlyDashboardQuery {
  year?: number;
  month?: number;
}
