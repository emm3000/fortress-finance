import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import { pushTokenSchema, unregisterTokenSchema } from '../validations/notification.validation';

const router = Router();

router.post('/register', requireAuth, validate(pushTokenSchema), notificationController.registerToken);
router.post(
  '/unregister',
  requireAuth,
  validate(unregisterTokenSchema),
  notificationController.unregisterToken
);

export default router;
