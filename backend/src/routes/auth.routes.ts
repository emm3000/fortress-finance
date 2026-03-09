import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authRateLimiter } from '../middlewares/authRateLimit';
import {
  confirmPasswordResetSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
} from '../validations/auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post(
  '/password-reset/request',
  authRateLimiter,
  validate(requestPasswordResetSchema),
  authController.requestPasswordReset,
);
router.post(
  '/password-reset/confirm',
  authRateLimiter,
  validate(confirmPasswordResetSchema),
  authController.confirmPasswordReset,
);

export default router;
