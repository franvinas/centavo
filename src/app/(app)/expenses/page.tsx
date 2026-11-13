import { positiveInteger } from "@/lib/date-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getExpenses } from "@/lib/data/expenses";
import { getCategories } from "@/lib/data/categories";
import { getTagNames } from "@/lib/data/tags";
import { parseTagFilter } from "@/lib/validations/tag";
import { ExpensesClient } from "./expenses-client";
import type { Expense, Category } from "@/types";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const params = await searchParams;
  const {
    expenses,
    total,
    totalAmount,
    pendingConversionCount,
    page,
    totalPages,
  } = await getExpenses({
    userId: user.id,
    search: params.search,
    categoryId: params.categoryId,
    tags: parseTagFilter(params.tags),
    from: params.from,
    to: params.to,
    page: positiveInteger(params.page, 1, 1_000_000),
  });

  const [categories, tagNames] = await Promise.all([
    getCategories(user.id),
    getTagNames(user.id),
  ]);

  const mappedExpenses: Expense[] = expenses.map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    currency: e.currency,
    baseAmount: e.baseAmount,
    conversionPending: e.conversionPending,
    baseCurrency: user.baseCurrency,
    description: e.description,
    date: e.date.toISOString(),
    categoryId: e.categoryId,
    category: e.category as Category,
    tags: e.tags.map((tag) => tag.name),
  }));

  const mappedCategories: Category[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon ?? "MoreHorizontal",
  }));

  return (
    <ExpensesClient
      expenses={mappedExpenses}
      categories={mappedCategories}
      tagNames={tagNames}
      total={total}
      totalAmount={totalAmount}
      pendingConversionCount={pendingConversionCount}
      baseCurrency={user.baseCurrency}
      page={page}
      totalPages={totalPages}
    />
  );
}
