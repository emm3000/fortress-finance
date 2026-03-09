import type { NextFunction, Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { AppError } from '../utils/AppError';
import type { MonthlyDashboardQuery } from '../validations/dashboard.validation';

type MonthlyDashboardRequest = Request<Record<string, never>, unknown, unknown, MonthlyDashboardQuery>;

export const getMonthlyDashboard = async (
  req: MonthlyDashboardRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'Usuario no identificado');
    }

    const { year, month } = req.query;
    const summary = await dashboardService.getMonthlyDashboard({
      userId,
      ...(typeof year === 'number' ? { year } : {}),
      ...(typeof month === 'number' ? { month } : {}),
    });

    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};
