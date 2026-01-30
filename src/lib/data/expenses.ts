import { prisma } from "@/lib/db";

interface GetExpensesOptions {
  userId: string;
  from?: string;
  to?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getExpenses({
  userId,
  from,
  to,
  categoryId,
  search,
  page = 1,
  limit = 50,
}: GetExpensesOptions) {
  const where: Record<string, unknown> = { userId };

  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (categoryId) where.categoryId = categoryId;
  if (search) where.description = { contains: search, mode: "insensitive" };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getExpenseById(id: string, userId: string) {
  return prisma.expense.findFirst({
    where: { id, userId },
    include: { category: true },
  });
}

export async function getExpenseSummary(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentMonthExpenses, lastMonthExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: startOfMonth } },
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
  ]);

  const totalSpent = currentMonthExpenses.reduce(
    (sum, e) => sum + Number(e.baseAmount),
    0,
  );
  const lastMonthTotal = lastMonthExpenses.reduce(
    (sum, e) => sum + Number(e.baseAmount),
    0,
  );

  return {
    totalSpent,
    expenseCount: currentMonthExpenses.length,
    lastMonthTotal,
    lastMonthCount: lastMonthExpenses.length,
    recentExpenses: currentMonthExpenses,
  };
}
