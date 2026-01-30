import { prisma } from "@/lib/db";

export async function hasAnyExpenses(userId: string): Promise<boolean> {
  const count = await prisma.expense.count({
    where: { userId },
    take: 1,
  });
  return count > 0;
}
