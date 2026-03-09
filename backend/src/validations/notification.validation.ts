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

export type PushTokenInput = z.infer<typeof pushTokenSchema>['body'];
export type UnregisterTokenInput = z.infer<typeof unregisterTokenSchema>['body'];
