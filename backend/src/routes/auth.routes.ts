import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authRateLimiter } from '../middlewares/authRateLimit';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

export default router;
