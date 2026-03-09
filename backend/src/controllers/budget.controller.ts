import type { Request, Response, NextFunction } from 'express';
import * as budgetService from '../services/budget.service';
import { AppError } from '../utils/AppError';
import type { BudgetInput } from '../validations/budget.validation';

type BudgetRequest = Request<Record<string, never>, unknown, BudgetInput>;

export const getBudgets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'Usuario no identificado');
    }

    const budgets = await budgetService.getBudgetsByUser(userId);
    res.status(200).json(budgets);
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateBudget = async (req: BudgetRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'Usuario no identificado');
    }

    const budget = await budgetService.upsertBudget(userId, req.body);
    res.status(200).json(budget);
  } catch (error) {
    next(error);
  }
};
