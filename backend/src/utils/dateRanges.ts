export interface UtcMonthRange {
  resolvedYear: number;
  resolvedMonth: number;
  from: Date;
  to: Date;
}

export const getUtcMonthRange = (year?: number, month?: number): UtcMonthRange => {
  const now = new Date();
  const resolvedYear = year ?? now.getUTCFullYear();
  const resolvedMonth = month ?? now.getUTCMonth() + 1;

  const from = new Date(Date.UTC(resolvedYear, resolvedMonth - 1, 1));
  const to = new Date(Date.UTC(resolvedYear, resolvedMonth, 1));

  return { resolvedYear, resolvedMonth, from, to };
};

