import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { getCategories } from "@/lib/data/categories";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { Category } from "@/types";

export default async function NewExpensePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const categories = await getCategories(user.id);
  const mapped: Category[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon ?? "MoreHorizontal",
    userId: c.userId,
  }));

  return (
    <ExpenseForm categories={mapped} defaultCurrency={user.baseCurrency} />
  );
}
