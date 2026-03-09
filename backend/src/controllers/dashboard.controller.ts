import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';
import { sendOk } from '../utils/response';
import type { MonthlyDashboardQuery } from '../validations/dashboard.validation';

export const getMonthlyDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const { year, month } = req.query as MonthlyDashboardQuery;
  const summary = await dashboardService.getMonthlyDashboard({
    userId,
    ...(typeof year === 'number' ? { year } : {}),
    ...(typeof month === 'number' ? { month } : {}),
  });

  sendOk(res, summary);
});
