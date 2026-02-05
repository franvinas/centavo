"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations/user";
import { getExchangeRate } from "@/lib/exchange-rate";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function updateUser(formData: {
  name?: string;
  baseCurrency?: string;
}) {
  const userId = await requireAuth();
  const parsed = updateUserSchema.parse(formData);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: parsed,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  // If base currency changed, recalculate all expense base amounts after
  // the response is sent so the user isn't blocked by the bulk update
  if (
    parsed.baseCurrency &&
    currentUser &&
    parsed.baseCurrency !== currentUser.baseCurrency
  ) {
    const newCurrency = parsed.baseCurrency;
    after(async () => {
      const expenses = await prisma.expense.findMany({
        where: { userId },
      });

      for (const expense of expenses) {
        const rate = await getExchangeRate(expense.currency, newCurrency);
        await prisma.expense.update({
          where: { id: expense.id },
          data: {
            baseAmount: parseFloat((Number(expense.amount) * rate).toFixed(2)),
            exchangeRate: rate,
          },
        });
      }

      revalidatePath("/settings");
      revalidatePath("/dashboard");
      revalidatePath("/expenses");
      revalidatePath("/analytics");
    });
  }
}
