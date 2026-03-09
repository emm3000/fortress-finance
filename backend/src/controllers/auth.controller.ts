import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import type {
  ConfirmPasswordResetBody,
  LoginBody,
  RegisterBody,
  RequestPasswordResetBody,
} from '../validations/auth.validation';

type RegisterRequest = Request<Record<string, never>, unknown, RegisterBody>;
type LoginRequest = Request<Record<string, never>, unknown, LoginBody>;
type RequestPasswordResetRequest = Request<Record<string, never>, unknown, RequestPasswordResetBody>;
type ConfirmPasswordResetRequest = Request<Record<string, never>, unknown, ConfirmPasswordResetBody>;

export const register = asyncHandler(async (req: RegisterRequest, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: LoginRequest, res: Response) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json(result);
});

export const requestPasswordReset = asyncHandler(
  async (req: RequestPasswordResetRequest, res: Response) => {
    const result = await authService.requestPasswordReset(req.body);
    res.status(200).json(result);
  },
);

export const confirmPasswordReset = asyncHandler(
  async (req: ConfirmPasswordResetRequest, res: Response) => {
    const result = await authService.confirmPasswordReset(req.body);
    res.status(200).json(result);
  },
);
