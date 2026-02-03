import { prisma } from "@/lib/db";
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
}

export async function getAnalyticsSummary({
  userId,
  from,
  to,
}: AnalyticsParams): Promise<AnalyticsSummary> {
  const result = await prisma.expense.aggregate({
    where: { userId, date: { gte: from, lte: to } },
    _sum: { baseAmount: true },
    _count: true,
  });

  const totalSpent = Number(result._sum.baseAmount ?? 0);
  const transactionCount = result._count;

  const daysDiff = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
  const dailyAverage = transactionCount > 0 ? totalSpent / daysDiff : 0;

  return { totalSpent, transactionCount, dailyAverage };
}

export async function getSpendingByCategory({
  userId,
  from,
  to,
}: AnalyticsParams): Promise<CategorySpending[]> {
  const groups = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { userId, date: { gte: from, lte: to } },
    _sum: { baseAmount: true },
    _count: true,
  });

  if (groups.length === 0) return [];

  const categoryIds = groups.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return groups
    .map((g) => {
      const cat = categoryMap.get(g.categoryId);
      return {
        categoryId: g.categoryId,
        name: cat?.name ?? "Unknown",
        color: cat?.color ?? "#888888",
        icon: cat?.icon ?? "MoreHorizontal",
        total: Number(g._sum.baseAmount ?? 0),
        count: g._count,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getSpendingOverTime({
  userId,
  from,
  to,
}: AnalyticsParams): Promise<TimeSeriesPoint[]> {
  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: from, lte: to } },
    select: { date: true, baseAmount: true },
  });

  // Group by YYYY-MM
  const monthTotals = new Map<string, number>();
  for (const e of expenses) {
    const d = e.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + Number(e.baseAmount));
  }

  // Fill in zero-months between from and to
  const result: TimeSeriesPoint[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    result.push({ period: key, total: monthTotals.get(key) ?? 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

export async function getSpendingByCurrency({
  userId,
  from,
  to,
}: AnalyticsParams): Promise<CurrencySpending[]> {
  const groups = await prisma.expense.groupBy({
    by: ["currency"],
    where: { userId, date: { gte: from, lte: to } },
    _sum: { amount: true, baseAmount: true },
    _count: true,
  });

  return groups
    .map((g) => ({
      currency: g.currency,
      originalTotal: Number(g._sum.amount ?? 0),
      baseTotal: Number(g._sum.baseAmount ?? 0),
      count: g._count,
    }))
    .sort((a, b) => b.baseTotal - a.baseTotal);
}
