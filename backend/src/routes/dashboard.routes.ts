import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import { monthlyDashboardQuerySchema } from '../validations/dashboard.validation';

const router = Router();

router.get('/monthly', requireAuth, validate(monthlyDashboardQuerySchema), dashboardController.getMonthlyDashboard);

export default router;
