import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthUser,
  unauthorized,
  notFound,
  badRequest,
} from "@/lib/api-utils";
import { updateExpenseSchema } from "@/lib/validations/expense";
import { getExchangeRate } from "@/lib/exchange-rate";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    include: { category: true },
  });

  if (!expense) return notFound("Expense not found");

  return NextResponse.json({ expense });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) return notFound("Expense not found");

  const body = await request.json();
  const parsed = updateExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (data.description !== undefined) updateData.description = data.description;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.notes !== undefined) updateData.notes = data.notes;

  // If amount or currency changed, recalculate base amount
  if (data.amount !== undefined || data.currency !== undefined) {
    const amount = data.amount ?? Number(existing.amount);
    const currency = data.currency ?? existing.currency;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { baseCurrency: true },
    });
    const baseCurrency = dbUser?.baseCurrency ?? "USD";

    const exchangeRate = await getExchangeRate(currency, baseCurrency);
    updateData.amount = amount;
    updateData.currency = currency;
    updateData.baseAmount = parseFloat((amount * exchangeRate).toFixed(2));
    updateData.exchangeRate = exchangeRate;
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  return NextResponse.json({ expense });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) return notFound("Expense not found");

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
