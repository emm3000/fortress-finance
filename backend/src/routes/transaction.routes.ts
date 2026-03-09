import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import {
  transactionIdParamSchema,
  updateTransactionSchema,
} from '../validations/transaction.validation';

const router = Router();

router.put(
  '/:id',
  requireAuth,
  validate(transactionIdParamSchema),
  validate(updateTransactionSchema),
  transactionController.update,
);

router.delete(
  '/:id',
  requireAuth,
  validate(transactionIdParamSchema),
  transactionController.remove,
);

export default router;
