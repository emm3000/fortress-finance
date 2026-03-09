import { z } from 'zod';

export const pushTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'El token es requerido'),
    deviceInfo: z.string().optional(),
  }),
});

export const unregisterTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'El token es requerido'),
  }),
});

export const notificationListQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number(value))
      .refine((value) => value >= 1 && value <= 100, 'limit debe estar entre 1 y 100')
      .optional(),
  }),
});

export type PushTokenInput = z.infer<typeof pushTokenSchema>['body'];
export type UnregisterTokenInput = z.infer<typeof unregisterTokenSchema>['body'];
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>['query'];
