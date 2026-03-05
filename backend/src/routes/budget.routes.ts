import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import { budgetSchema } from '../validations/budget.validation';

const router = Router();

router.get('/', requireAuth, budgetController.getBudgets);
router.post('/', requireAuth, validate(budgetSchema), budgetController.createOrUpdateBudget);

export default router;
