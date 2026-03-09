import type { Request, Response } from 'express';
import * as onboardingService from '../services/onboarding.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';
import { sendOk } from '../utils/response';
import type { OnboardingPreferencesInput } from '../validations/onboarding.validation';

type OnboardingPreferencesRequest = Request<
  Record<string, never>,
  unknown,
  OnboardingPreferencesInput
>;

export const savePreferences = asyncHandler(async (req: OnboardingPreferencesRequest, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const preferences = await onboardingService.upsertUserPreferences(userId, req.body);
  sendOk(res, preferences);
});
