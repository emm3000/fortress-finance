import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import type { RegisterBody, LoginBody } from '../validations/auth.validation';

type RegisterRequest = Request<Record<string, never>, unknown, RegisterBody>;
type LoginRequest = Request<Record<string, never>, unknown, LoginBody>;

export const register = async (req: RegisterRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: LoginRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
