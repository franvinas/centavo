import { prisma } from "@/lib/db";

export const categoryOrderBy = [
  { position: "asc" as const },
  { createdAt: "asc" as const },
];

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: categoryOrderBy,
  });
}
