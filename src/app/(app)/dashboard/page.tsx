import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("dashboard");

  const hasExpenses = await hasAnyExpenses(user.id);
  if (!hasExpenses) {
    return <EmptyStateDashboard userName={user.name ?? "there"} />;
  }

  const summary = await getExpenseSummary(user.id);

  const totalSpent = summary.totalSpent;
  const lastMonthTotal = summary.lastMonthTotal;

  // Calculate trend
  const spendDiff =
    lastMonthTotal > 0
      ? Math.round(((totalSpent - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;
  // Map Prisma results to our UI types
  const expenses: Expense[] = summary.recentExpenses.map(mapExpense);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-semibold">
          {t("greeting", { name: user.name ?? "there" })}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">{t("overview")}</p>
      </div>

      <MetricCard
        label={t("totalSpent")}
        value={formatCurrency(totalSpent, user.baseCurrency)}
        trend={
          lastMonthTotal > 0
            ? {
                value:
                  spendDiff <= 0
                    ? t("lessLastMonth", { value: Math.abs(spendDiff) })
                    : t("moreLastMonth", { value: Math.abs(spendDiff) }),
                positive: spendDiff <= 0,
              }
            : undefined
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-bg-surface shadow-card rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-text-primary text-base font-semibold">
              {t("byCategory")}
            </h2>
            <Link
              href="/categories"
              className="text-accent-primary text-xs font-medium"
            >
              {t("allCategories")}
            </Link>
          </div>
          <CategoryBreakdown expenses={expenses} />
        </div>

        <div className="bg-bg-surface shadow-card rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-text-primary text-base font-semibold">
              {t("recentExpenses")}
            </h2>
            <Link
              href="/expenses"
              className="text-accent-primary text-xs font-medium"
            >
              {t("viewAll")}
            </Link>
          </div>
          {expenses.length === 0 ? (
            <p className="text-text-tertiary py-8 text-center text-sm">
              {t("noExpensesMonth")}
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
