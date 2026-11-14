import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { sumDisplayAmounts } from "@/lib/expense-valuation";
import { renameTagSchema } from "@/lib/validations/tag";

type DbClient = typeof prisma | Prisma.TransactionClient;

/** Prisma include that loads an expense's tags sorted by name. */
export const expenseTagsInclude = {
  include: { tag: { select: { id: true, name: true } } },
  orderBy: { tag: { name: "asc" } },
} as const;

export interface TagRef {
  id: string;
  name: string;
}

/** Replace the join rows from `include` with a flat `{ id, name }[]`. */
export function flattenExpenseTags<T extends { tags?: Array<{ tag: TagRef }> }>(
  expense: T,
): Omit<T, "tags"> & { tags: TagRef[] } {
  return {
    ...expense,
    tags: (expense.tags ?? []).map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
    })),
  };
}

/** Prisma filter for "has any of these tags". Names must be normalized. */
export function anyTagWhere(names: string[]) {
  return { some: { tag: { name: { in: names } } } };
}

/** Find or create the user's tags by normalized name; returns their ids. */
export async function resolveTagIds(
  db: DbClient,
  userId: string,
  names: string[],
) {
  if (names.length === 0) return [];
  await db.tag.createMany({
    data: names.map((name) => ({ userId, name })),
    skipDuplicates: true,
  });
  const tags = await db.tag.findMany({
    where: { userId, name: { in: names } },
    select: { id: true, name: true },
  });
  const byName = new Map(tags.map((tag) => [tag.name, tag.id]));
  return names.map((name) => {
    const id = byName.get(name);
    if (!id) throw new Error(`Unable to resolve tag "${name}"`);
    return id;
  });
}

export async function listTagNamesForUser(userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return tags.map((tag) => tag.name);
}

/**
 * Every tag with how many expenses carry it and their total in the user's
 * display currency. An expense with several tags counts toward each one, so
 * these totals are not additive.
 */
export async function listTagsWithTotalsForUser(userId: string) {
  const [user, tags] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    }),
    prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expenses: {
          select: {
            expense: {
              select: {
                amount: true,
                currency: true,
                usdAmount: true,
                usdExchangeRate: true,
                conversionRates: true,
              },
            },
          },
        },
      },
    }),
  ]);
  const currency = user?.baseCurrency ?? "USD";

  return tags.map((tag) => {
    const expenses = tag.expenses.map(({ expense }) => expense);
    const { total, pendingConversionCount } = sumDisplayAmounts(
      expenses,
      currency,
    );
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
      expenseCount: expenses.length,
      total,
      currency,
      pendingConversionCount,
    };
  });
}

/**
 * Rename a tag. Renaming onto another existing tag merges them: its expenses
 * move to the existing tag and this one is deleted.
 */
export async function renameTagForUser(
  userId: string,
  tagId: string,
  input: { name: string },
) {
  const { name } = renameTagSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const tag = await tx.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw new Error("Tag not found");
    if (tag.name === name) return { tag, merged: false };

    const target = await tx.tag.findUnique({
      where: { userId_name: { userId, name } },
    });
    if (!target) {
      const renamed = await tx.tag.update({
        where: { id: tag.id },
        data: { name },
      });
      return { tag: renamed, merged: false };
    }

    const links = await tx.expenseTag.findMany({
      where: { tagId: tag.id },
      select: { expenseId: true },
    });
    await tx.expenseTag.createMany({
      data: links.map(({ expenseId }) => ({ expenseId, tagId: target.id })),
      skipDuplicates: true,
    });
    await tx.tag.delete({ where: { id: tag.id } });
    return { tag: target, merged: true };
  });
}

/** Delete a tag. Its expenses stay; they just lose the label. */
export async function deleteTagForUser(userId: string, tagId: string) {
  const { count } = await prisma.tag.deleteMany({
    where: { id: tagId, userId },
  });
  if (count === 0) throw new Error("Tag not found");
  return { success: true };
}
