import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  }),
});

export const requestPasswordResetSchema = z.object({
  body: z.object({
    email: z.email('Email inválido'),
  }),
});

export const confirmPasswordResetSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'Token inválido'),
    newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
export type RequestPasswordResetBody = z.infer<typeof requestPasswordResetSchema>['body'];
export type ConfirmPasswordResetBody = z.infer<typeof confirmPasswordResetSchema>['body'];
