import { prisma } from "@/lib/db";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/lib/validations/expense";
import { getExchangeRate } from "@/lib/exchange-rate";

export async function createExpenseForUser(
  userId: string,
  input: {
    amount: number;
    currency: string;
    description: string;
    categoryId: string;
    date: string;
    notes?: string;
  },
) {
  const parsed = createExpenseSchema.parse(input);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });
  const baseCurrency = dbUser?.baseCurrency ?? "USD";

  const exchangeRate = await getExchangeRate(parsed.currency, baseCurrency);
  const baseAmount = parseFloat((parsed.amount * exchangeRate).toFixed(2));

  return prisma.expense.create({
    data: {
      userId,
      amount: parsed.amount,
      currency: parsed.currency,
      baseAmount,
      exchangeRate,
      description: parsed.description,
      categoryId: parsed.categoryId,
      date: new Date(parsed.date),
      notes: parsed.notes,
    },
    include: { category: true },
  });
}

export async function updateExpenseForUser(
  userId: string,
  expenseId: string,
  input: {
    amount?: number;
    currency?: string;
    description?: string;
    categoryId?: string;
    date?: string;
    notes?: string;
  },
) {
  const parsed = updateExpenseSchema.parse(input);

  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });
  if (!existing) throw new Error("Expense not found");

  const updateData: Record<string, unknown> = {};
  if (parsed.description !== undefined)
    updateData.description = parsed.description;
  if (parsed.categoryId !== undefined)
    updateData.categoryId = parsed.categoryId;
  if (parsed.date !== undefined) updateData.date = new Date(parsed.date);
  if (parsed.notes !== undefined) updateData.notes = parsed.notes;

  if (parsed.amount !== undefined || parsed.currency !== undefined) {
    const amount = parsed.amount ?? Number(existing.amount);
    const currency = parsed.currency ?? existing.currency;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });
    const baseCurrency = dbUser?.baseCurrency ?? "USD";

    const exchangeRate = await getExchangeRate(currency, baseCurrency);
    updateData.amount = amount;
    updateData.currency = currency;
    updateData.baseAmount = parseFloat((amount * exchangeRate).toFixed(2));
    updateData.exchangeRate = exchangeRate;
  }

  return prisma.expense.update({
    where: { id: expenseId },
    data: updateData,
    include: { category: true },
  });
}

export async function deleteExpenseForUser(userId: string, expenseId: string) {
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });
  if (!existing) throw new Error("Expense not found");

  await prisma.expense.delete({ where: { id: expenseId } });
  return { success: true };
}
