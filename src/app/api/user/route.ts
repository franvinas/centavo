import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { updateUserSchema } from "@/lib/validations/user";
import { getExchangeRate } from "@/lib/exchange-rate";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return NextResponse.json({ user: dbUser });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { baseCurrency: true },
  });

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  // If base currency changed, recalculate all expense base amounts
  if (
    parsed.data.baseCurrency &&
    currentUser &&
    parsed.data.baseCurrency !== currentUser.baseCurrency
  ) {
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id },
    });

    for (const expense of expenses) {
      const rate = await getExchangeRate(
        expense.currency,
        parsed.data.baseCurrency,
      );
      await prisma.expense.update({
        where: { id: expense.id },
        data: {
          baseAmount: parseFloat((Number(expense.amount) * rate).toFixed(2)),
          exchangeRate: rate,
        },
      });
    }
  }

  return NextResponse.json({ user: updatedUser });
}
