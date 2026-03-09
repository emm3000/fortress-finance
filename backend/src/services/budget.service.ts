import type { BudgetDto } from '../dto/budget.dto';
import { mapBudgetToDto, mapBudgetsToDto } from '../mappers/budget.mapper';
import * as budgetRepository from '../repositories/budget.repository';
import type { BudgetInput } from '../validations/budget.validation';

/**
 * Get all budgets for a specific user
 */
export const getBudgetsByUser = async (userId: string): Promise<BudgetDto[]> => {
  const budgets = await budgetRepository.findBudgetsByUserId(userId);
  return mapBudgetsToDto(budgets);
};

/**
 * Create or update a budget for a user and category
 */
export const upsertBudget = async (userId: string, data: BudgetInput): Promise<BudgetDto> => {
  const { categoryId, limitAmount, period } = data;

  const budget = await budgetRepository.upsertBudgetByUserAndCategory(userId, {
    categoryId,
    limitAmount,
    period,
  });

  return mapBudgetToDto(budget);
};
