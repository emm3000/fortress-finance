import { z } from 'zod';

export const onboardingPreferencesSchema = z.object({
  body: z.object({
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, 'La moneda debe estar en formato ISO de 3 letras (ej: USD)'),
    monthlyIncomeGoal: z
      .number()
      .positive('El ingreso mensual objetivo debe ser mayor a 0')
      .max(9999999999.99, 'El ingreso mensual objetivo excede el límite permitido'),
  }),
});

export type OnboardingPreferencesInput = z.infer<typeof onboardingPreferencesSchema>['body'];
