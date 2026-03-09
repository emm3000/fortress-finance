import type { Request, Response } from 'express';
import * as budgetService from '../services/budget.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';
import { sendOk } from '../utils/response';
import type { BudgetInput } from '../validations/budget.validation';

type BudgetRequest = Request<Record<string, never>, unknown, BudgetInput>;

export const getBudgets = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const budgets = await budgetService.getBudgetsByUser(userId);
  sendOk(res, budgets);
});

export const createOrUpdateBudget = asyncHandler(async (req: BudgetRequest, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const budget = await budgetService.upsertBudget(userId, req.body);
  sendOk(res, budget);
});
