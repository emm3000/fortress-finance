import type { MonthlyDashboardSummaryDto } from '../dto/dashboard.dto';

export const mapMonthlyDashboardToDto = (
  summary: MonthlyDashboardSummaryDto,
): MonthlyDashboardSummaryDto => ({
  period: summary.period,
  totals: summary.totals,
  txCount: summary.txCount,
  topExpenseCategories: summary.topExpenseCategories,
});

