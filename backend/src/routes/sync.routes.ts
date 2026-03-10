import { Router } from 'express';
import * as syncController from '../controllers/sync.controller';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { syncRateLimiter } from '../middlewares/syncRateLimit';
import { syncSchema } from '../validations/sync.validation';

const router = Router();

router.post('/', syncRateLimiter, requireAuth, validate(syncSchema), syncController.syncTransactions);

export default router;
