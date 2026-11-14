import {
  parseDateOnly,
  positiveInteger,
  todayInTimezone,
} from "@/lib/date-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { presentExpense, sumDisplayAmounts } from "@/lib/expense-valuation";
import {
  anyTagWhere,
  expenseTagsInclude,
  flattenExpenseTags,
} from "@/lib/services/tags";

const expenseInclude = { category: true, tags: expenseTagsInclude } as const;

interface GetExpensesOptions {
  userId: string;
  from?: string;
  to?: string;
  categoryId?: string;
  /** Normalized tag names; matches expenses carrying any of them. */
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export async function getExpenses({
  userId,
  from,
  to,
  categoryId,
  tags,
  search,
  page = 1,
  limit = 50,
}: GetExpensesOptions) {
  page = positiveInteger(page, 1, 1_000_000);
  limit = positiveInteger(limit, 50, 100);
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  const where: Record<string, unknown> = { userId };

  if (fromDate || toDate) {
    where.date = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }
  if (categoryId) where.categoryId = categoryId;
  if (tags?.length) where.tags = anyTagWhere(tags);
  if (search) where.description = { contains: search, mode: "insensitive" };

  const [expenses, total, valuations, user] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: expenseInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
    // Every matching row (not just this page) so filtered totals are exact.
    prisma.expense.findMany({
      where,
      select: {
        amount: true,
        currency: true,
        usdAmount: true,
        usdExchangeRate: true,
        conversionRates: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true, timezone: true },
    }),
  ]);

  const baseCurrency = user?.baseCurrency ?? "USD";
  const sum = sumDisplayAmounts(valuations, baseCurrency);
  return {
    expenses: expenses.map((expense) =>
      presentExpense(flattenExpenseTags(expense), baseCurrency),
    ),
    total,
    totalAmount: sum.total,
    pendingConversionCount: sum.pendingConversionCount,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getExpenseById(id: string, userId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, userId },
    include: expenseInclude,
  });
  return expense ? flattenExpenseTags(expense) : null;
}

export const getExpenseSummary = cache(async function getExpenseSummary(
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true, timezone: true },
  });
  const baseCurrency = user?.baseCurrency ?? "USD";
  const now = todayInTimezone(user?.timezone ?? "UTC");
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const startOfLastMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );

  const [currentMonthExpenses, lastMonthExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: startOfMonth, lt: startOfNextMonth } },
      include: expenseInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startOfLastMonth, lt: startOfMonth },
      },
    }),
  ]);

  const current = sumDisplayAmounts(currentMonthExpenses, baseCurrency);
  const last = sumDisplayAmounts(lastMonthExpenses, baseCurrency);
  return {
    baseCurrency,
    totalSpent: current.total,
    pendingConversionCount: current.pendingConversionCount,
    expenseCount: currentMonthExpenses.length,
    lastMonthTotal: last.total,
    lastMonthPendingConversionCount: last.pendingConversionCount,
    lastMonthCount: lastMonthExpenses.length,
    recentExpenses: currentMonthExpenses.map((expense) =>
      presentExpense(flattenExpenseTags(expense), baseCurrency),
    ),
  };
});
