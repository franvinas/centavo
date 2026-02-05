import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getExpenseById } from "@/lib/data/expenses";
import { getCategories } from "@/lib/data/categories";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { Category } from "@/types";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const { id } = await params;
  const expense = await getExpenseById(id, user.id);
  if (!expense) notFound();

  const categories = await getCategories(user.id);
  const mapped: Category[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon ?? "MoreHorizontal",
    userId: c.userId,
  }));

  return (
    <ExpenseForm
      expense={{
        id: expense.id,
        amount: Number(expense.amount),
        currency: expense.currency,
        description: expense.description,
        date: expense.date.toISOString(),
        notes: expense.notes ?? undefined,
        categoryId: expense.categoryId,
      }}
      categories={mapped}
      defaultCurrency={user.baseCurrency}
    />
  );
}
