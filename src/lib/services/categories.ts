import { prisma } from "@/lib/db";
import { reassignCategorySchema } from "@/lib/validations/category-reassign";

export async function reassignCategoryForUser(
  userId: string,
  input: {
    fromCategoryId: string;
    toCategoryId: string;
  },
) {
  const parsed = reassignCategorySchema.parse(input);

  const categories = await prisma.category.findMany({
    where: {
      userId,
      id: { in: [parsed.fromCategoryId, parsed.toCategoryId] },
    },
    select: { id: true },
  });

  if (categories.length !== 2) {
    throw new Error("Category not found");
  }

  const result = await prisma.expense.updateMany({
    where: {
      userId,
      categoryId: parsed.fromCategoryId,
    },
    data: {
      categoryId: parsed.toCategoryId,
    },
  });

  return {
    success: true,
    reassigned: result.count,
  };
}
