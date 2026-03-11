export const queryKeys = {
  budgets: (userId?: string) => ["budgets", userId] as const,
  budgetProgress: (userId?: string, year?: number, month?: number) =>
    year && month
      ? (["budget-progress", userId, year, month] as const)
      : (["budget-progress", userId] as const),
  castle: (userId?: string) => ["castle", userId] as const,
  categories: (userId?: string) => ["categories", userId] as const,
  dashboardMonthly: (userId?: string, year?: number, month?: number) =>
    year && month
      ? (["dashboard", "monthly", userId, year, month] as const)
      : (["dashboard", "monthly", userId] as const),
  notifications: (userId?: string) => ["notifications", userId] as const,
  syncQueueStatus: (userId?: string) => ["sync-queue-status", userId] as const,
  transactions: (userId?: string) => ["transactions", userId] as const,
};
