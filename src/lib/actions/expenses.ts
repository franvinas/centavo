"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validations/expense";
import { getExchangeRate } from "@/lib/exchange-rate";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createExpense(formData: {
  amount: number;
  currency: string;
  description: string;
  categoryId: string;
  date: string;
  notes?: string;
}) {
  const userId = await requireAuth();
  const parsed = createExpenseSchema.parse(formData);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });
  const baseCurrency = dbUser?.baseCurrency ?? "USD";

  const exchangeRate = await getExchangeRate(parsed.currency, baseCurrency);
  const baseAmount = parseFloat((parsed.amount * exchangeRate).toFixed(2));

  await prisma.expense.create({
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
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function updateExpense(
  id: string,
  formData: {
    amount?: number;
    currency?: string;
    description?: string;
    categoryId?: string;
    date?: string;
    notes?: string;
  },
) {
  const userId = await requireAuth();
  const parsed = updateExpenseSchema.parse(formData);

  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Expense not found");

  const updateData: Record<string, unknown> = {};
  if (parsed.description !== undefined) updateData.description = parsed.description;
  if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId;
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

  await prisma.expense.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
}

export async function deleteExpense(id: string) {
  const userId = await requireAuth();

  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Expense not found");

  await prisma.expense.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}
