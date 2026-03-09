import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import { onboardingPreferencesSchema } from '../validations/onboarding.validation';

const router = Router();

router.post(
  '/preferences',
  requireAuth,
  validate(onboardingPreferencesSchema),
  onboardingController.savePreferences,
);

export default router;
