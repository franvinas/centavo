import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { createExpenseSchema } from "@/lib/validations/expense";
import { getExchangeRate } from "@/lib/exchange-rate";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));

  const where: Record<string, unknown> = { userId: user.id };

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

  return NextResponse.json({
    expenses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { amount, currency, description, categoryId, date, notes } =
    parsed.data;

  // Get user's base currency
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { baseCurrency: true },
  });
  const baseCurrency = dbUser?.baseCurrency ?? "USD";

  // Calculate exchange rate
  const exchangeRate = await getExchangeRate(currency, baseCurrency);
  const baseAmount = parseFloat((amount * exchangeRate).toFixed(2));

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      amount,
      currency,
      baseAmount,
      exchangeRate,
      description,
      categoryId,
      date: new Date(date),
      notes,
    },
    include: { category: true },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
