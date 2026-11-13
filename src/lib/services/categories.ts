import { prisma } from "@/lib/db";
import { reassignCategorySchema } from "@/lib/validations/category-reassign";
import { reorderCategoriesSchema } from "@/lib/validations/category-reorder";

export const CATEGORY_ORDER_CHANGED = "Category list changed";

/** Position for a newly created category: after all existing ones. */
export async function nextCategoryPosition(userId: string) {
  const result = await prisma.category.aggregate({
    where: { userId },
    _max: { position: true },
  });
  return (result._max.position ?? -1) + 1;
}

/**
 * Stores a new category order. `ids` must list every category the user has,
 * so a stale client (e.g. a category added in another tab) cannot silently
 * drop categories from the ordering.
 */
export async function reorderCategoriesForUser(
  userId: string,
  input: { ids: string[] },
) {
  const { ids } = reorderCategoriesSchema.parse(input);

  const existing = await prisma.category.findMany({
    where: { userId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((category) => category.id));

  if (
    existingIds.size !== ids.length ||
    !ids.every((id) => existingIds.has(id))
  ) {
    throw new Error(CATEGORY_ORDER_CHANGED);
  }

  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.category.update({
        where: { id, userId },
        data: { position },
      }),
    ),
  );

  return { success: true };
}

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
