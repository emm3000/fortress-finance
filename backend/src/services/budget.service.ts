import * as budgetRepository from '../repositories/budget.repository';
import type { BudgetInput } from '../validations/budget.validation';

/**
 * Get all budgets for a specific user
 */
export const getBudgetsByUser = async (userId: string) => {
  return budgetRepository.findBudgetsByUserId(userId);
};

/**
 * Create or update a budget for a user and category
 */
export const upsertBudget = async (userId: string, data: BudgetInput) => {
  const { categoryId, limitAmount, period } = data;

  return budgetRepository.upsertBudgetByUserAndCategory(userId, {
    categoryId,
    limitAmount,
    period,
  });
};
