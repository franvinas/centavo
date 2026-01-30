import { prisma } from "@/lib/db";

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}
