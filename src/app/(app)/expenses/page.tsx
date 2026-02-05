import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getExpenses } from "@/lib/data/expenses";
import { getCategories } from "@/lib/data/categories";
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
  const { expenses, total, page, totalPages } = await getExpenses({
    userId: user.id,
    search: params.search,
    categoryId: params.categoryId,
    from: params.from,
    to: params.to,
    page: params.page ? parseInt(params.page) : 1,
  });

  const categories = await getCategories(user.id);

  const mappedExpenses: Expense[] = expenses.map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    currency: e.currency,
    baseAmount: Number(e.baseAmount),
    baseCurrency: user.baseCurrency,
    description: e.description,
    notes: e.notes ?? undefined,
    date: e.date.toISOString(),
    categoryId: e.categoryId,
    category: e.category as Category,
    userId: e.userId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  const mappedCategories: Category[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon ?? "MoreHorizontal",
    userId: c.userId,
  }));

  return (
    <ExpensesClient
      expenses={mappedExpenses}
      categories={mappedCategories}
      total={total}
      page={page}
      totalPages={totalPages}
    />
  );
}
