import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { MetricCard } from "@/components/expenses/metric-card";
import { ExpenseList } from "@/components/expenses/expense-list";
import { CategoryBreakdown } from "@/components/expenses/category-breakdown";
import { EmptyStateDashboard } from "@/components/dashboard/empty-state";
import { getCurrentUser } from "@/lib/data/user";
import { getExpenseSummary } from "@/lib/data/expenses";
import { hasAnyExpenses } from "@/lib/data/onboarding";
import Link from "next/link";
import type { Expense, Category } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const hasExpenses = await hasAnyExpenses(user.id);
  if (!hasExpenses) {
    return <EmptyStateDashboard userName={user.name ?? "there"} />;
  }

  const summary = await getExpenseSummary(user.id);

  const totalSpent = summary.totalSpent;
  const expenseCount = summary.expenseCount;
  const lastMonthTotal = summary.lastMonthTotal;
  const lastMonthCount = summary.lastMonthCount;

  // Calculate trend
  const spendDiff =
    lastMonthTotal > 0
      ? Math.round(((totalSpent - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;
  const countDiff = expenseCount - lastMonthCount;
  const topCategory = getTopCategory(summary.recentExpenses);

  // Map Prisma results to our UI types
  const expenses: Expense[] = summary.recentExpenses.map(mapExpense);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Good morning, {user.name ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Here&apos;s your expense overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MetricCard
          label="Total Spent"
          value={formatCurrency(totalSpent, user.baseCurrency)}
          trend={
            lastMonthTotal > 0
              ? {
                  value: `${Math.abs(spendDiff)}% ${spendDiff <= 0 ? "less" : "more"} than last month`,
                  positive: spendDiff <= 0,
                }
              : undefined
          }
        />
        <MetricCard
          label="Expenses"
          value={String(expenseCount)}
          trend={
            lastMonthCount > 0
              ? {
                  value: `${Math.abs(countDiff)} ${countDiff <= 0 ? "fewer" : "more"} than last month`,
                  positive: countDiff <= 0,
                }
              : undefined
          }
        />
        <div className="col-span-2 md:col-span-1">
          <MetricCard label="Top Category" value={topCategory} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              By Category
            </h2>
            <Link
              href="/categories"
              className="text-xs font-medium text-accent-primary"
            >
              All categories
            </Link>
          </div>
          <CategoryBreakdown expenses={expenses} />
        </div>

        <div className="rounded-lg bg-bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              Recent Expenses
            </h2>
            <Link
              href="/expenses"
              className="text-xs font-medium text-accent-primary"
            >
              View all
            </Link>
          </div>
          {expenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-tertiary">
              No expenses this month. Tap + to add one.
            </p>
          ) : (
            <ExpenseList expenses={expenses.slice(0, 8)} />
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpense(e: any): Expense {
  return {
    id: e.id,
    amount: Number(e.amount),
    currency: e.currency,
    baseAmount: Number(e.baseAmount),
    baseCurrency: e.baseCurrency ?? "USD",
    description: e.description,
    notes: e.notes ?? undefined,
    date: e.date.toISOString(),
    categoryId: e.categoryId,
    category: e.category as Category,
    userId: e.userId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTopCategory(expenses: any[]): string {
  const totals = new Map<string, { name: string; total: number }>();
  for (const expense of expenses) {
    const existing = totals.get(expense.categoryId);
    if (existing) {
      existing.total += Number(expense.baseAmount);
    } else {
      totals.set(expense.categoryId, {
        name: expense.category?.name ?? "Unknown",
        total: Number(expense.baseAmount),
      });
    }
  }
  let top = { name: "None", total: 0 };
  for (const cat of totals.values()) {
    if (cat.total > top.total) top = cat;
  }
  return top.name;
}
