import { Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { Expense, Category } from "@/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  const t = await getTranslations("dashboard");

  const hasExpenses = await hasAnyExpenses(user.id);
  if (!hasExpenses) {
    return <EmptyStateDashboard userName={user.name ?? "there"} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-semibold">
          {t("greeting", { name: user.name ?? "there" })}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">{t("overview")}</p>
      </div>

      <Suspense fallback={<MetricCardSkeleton />}>
        <DashboardMetric userId={user.id} baseCurrency={user.baseCurrency} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<CategoryBreakdownSkeleton />}>
          <DashboardCategoryBreakdown userId={user.id} />
        </Suspense>

        <Suspense fallback={<RecentExpensesSkeleton />}>
          <DashboardRecentExpenses
            userId={user.id}
            baseCurrency={user.baseCurrency}
          />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardMetric({
  userId,
  baseCurrency,
}: {
  userId: string;
  baseCurrency: string;
}) {
  const t = await getTranslations("dashboard");
  const summary = await getExpenseSummary(userId);

  const totalSpent = summary.totalSpent;
  const lastMonthTotal = summary.lastMonthTotal;

  const spendDiff =
    lastMonthTotal > 0
      ? Math.round(((totalSpent - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

  return (
    <MetricCard
      label={t("totalSpent")}
      value={formatCurrency(totalSpent, baseCurrency)}
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
  );
}

async function DashboardCategoryBreakdown({ userId }: { userId: string }) {
  const t = await getTranslations("dashboard");
  const summary = await getExpenseSummary(userId);
  const expenses: Expense[] = summary.recentExpenses.map(mapExpense);

  return (
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
  );
}

async function DashboardRecentExpenses({
  userId,
  baseCurrency,
}: {
  userId: string;
  baseCurrency: string;
}) {
  const t = await getTranslations("dashboard");
  const summary = await getExpenseSummary(userId);
  const expenses: Expense[] = summary.recentExpenses.map((e) => ({
    ...mapExpense(e),
    baseCurrency,
  }));

  return (
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
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-bg-surface shadow-card rounded-lg p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-2 h-8 w-32" />
    </div>
  );
}

function CategoryBreakdownSkeleton() {
  return (
    <div className="bg-bg-surface shadow-card rounded-lg p-5">
      <Skeleton className="mb-4 h-5 w-28" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentExpensesSkeleton() {
  return (
    <div className="bg-bg-surface shadow-card rounded-lg p-5">
      <Skeleton className="mb-4 h-5 w-36" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
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
    date: e.date.toISOString(),
    categoryId: e.categoryId,
    category: e.category as Category,
  };
}
