import type { BudgetDto } from '../dto/budget.dto';

export const mapBudgetToDto = (budget: BudgetDto): BudgetDto => ({
  ...budget,
  category: {
    ...budget.category,
  },
});

export const mapBudgetsToDto = (budgets: BudgetDto[]): BudgetDto[] => {
  return budgets.map(mapBudgetToDto);
};

