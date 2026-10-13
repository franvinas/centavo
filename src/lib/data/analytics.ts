import { prisma } from "@/lib/db";
import { getDisplayAmount, sumDisplayAmounts } from "@/lib/expense-valuation";
import type {
  AnalyticsSummary,
  CategorySpending,
  TimeSeriesPoint,
  CurrencySpending,
} from "@/types/analytics";

interface AnalyticsParams {
  userId: string;
  from: Date;
  to: Date;
  baseCurrency?: string;
}

async function getValuedExpenses({
  userId,
  from,
  to,
  baseCurrency,
}: AnalyticsParams) {
  const user = baseCurrency
    ? null
    : await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
      });
  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: from, lte: to } },
    include: { category: true },
  });
  return { expenses, currency: baseCurrency ?? user?.baseCurrency ?? "USD" };
}

export async function getAnalyticsSummary(
  params: AnalyticsParams,
): Promise<AnalyticsSummary> {
  const { expenses, currency } = await getValuedExpenses(params);
  const { total, pendingConversionCount } = sumDisplayAmounts(
    expenses,
    currency,
  );
  const days = Math.max(
    1,
    Math.round((params.to.getTime() - params.from.getTime()) / 86400000) + 1,
  );
  return {
    totalSpent: total,
    transactionCount: expenses.length,
    dailyAverage: total / days,
    pendingConversionCount,
  };
}

export async function getSpendingByCategory(
  params: AnalyticsParams,
): Promise<CategorySpending[]> {
  const { expenses, currency } = await getValuedExpenses(params);
  const groups = new Map<string, CategorySpending>();
  for (const expense of expenses) {
    const group = groups.get(expense.categoryId) ?? {
      categoryId: expense.categoryId,
      name: expense.category.name,
      color: expense.category.color,
      icon: expense.category.icon ?? "MoreHorizontal",
      total: 0,
      count: 0,
      pendingConversionCount: 0,
    };
    const value = getDisplayAmount(expense, currency);
    group.count++;
    if (value === null)
      group.pendingConversionCount = (group.pendingConversionCount ?? 0) + 1;
    else group.total = Math.round((group.total + value) * 100) / 100;
    groups.set(expense.categoryId, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

export async function getSpendingOverTime(
  params: AnalyticsParams,
): Promise<TimeSeriesPoint[]> {
  const { expenses, currency } = await getValuedExpenses(params);
  const groups = new Map<string, TimeSeriesPoint>();
  for (const expense of expenses) {
    const period = expense.date.toISOString().slice(0, 7);
    const group = groups.get(period) ?? {
      period,
      total: 0,
      pendingConversionCount: 0,
    };
    const value = getDisplayAmount(expense, currency);
    if (value === null)
      group.pendingConversionCount = (group.pendingConversionCount ?? 0) + 1;
    else group.total = Math.round((group.total + value) * 100) / 100;
    groups.set(period, group);
  }
  const result: TimeSeriesPoint[] = [];
  const cursor = new Date(
    Date.UTC(params.from.getUTCFullYear(), params.from.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(params.to.getUTCFullYear(), params.to.getUTCMonth(), 1),
  );
  while (cursor <= end) {
    const period = cursor.toISOString().slice(0, 7);
    result.push(
      groups.get(period) ?? { period, total: 0, pendingConversionCount: 0 },
    );
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return result;
}

export async function getSpendingByCurrency(
  params: AnalyticsParams,
): Promise<CurrencySpending[]> {
  const { expenses, currency } = await getValuedExpenses(params);
  const groups = new Map<string, CurrencySpending>();
  for (const expense of expenses) {
    const group = groups.get(expense.currency) ?? {
      currency: expense.currency,
      originalTotal: 0,
      baseTotal: 0,
      count: 0,
      pendingConversionCount: 0,
    };
    group.originalTotal =
      Math.round((group.originalTotal + Number(expense.amount)) * 100) / 100;
    group.count++;
    const value = getDisplayAmount(expense, currency);
    if (value === null)
      group.pendingConversionCount = (group.pendingConversionCount ?? 0) + 1;
    else group.baseTotal = Math.round((group.baseTotal + value) * 100) / 100;
    groups.set(expense.currency, group);
  }
  return [...groups.values()].sort((a, b) => b.baseTotal - a.baseTotal);
}
