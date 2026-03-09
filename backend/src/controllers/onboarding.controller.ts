import type { NextFunction, Request, Response } from 'express';
import * as onboardingService from '../services/onboarding.service';
import { AppError } from '../utils/AppError';
import type { OnboardingPreferencesInput } from '../validations/onboarding.validation';

type OnboardingPreferencesRequest = Request<
  Record<string, never>,
  unknown,
  OnboardingPreferencesInput
>;

export const savePreferences = async (
  req: OnboardingPreferencesRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'Usuario no identificado');
    }

    const preferences = await onboardingService.upsertUserPreferences(userId, req.body);
    res.status(200).json(preferences);
  } catch (error) {
    next(error);
  }
};
