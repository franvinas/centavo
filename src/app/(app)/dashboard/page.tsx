import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { formatCurrency } from "@/lib/format";
import { ConversionNotice } from "@/components/expenses/conversion-notice";
import { MetricCard } from "@/components/expenses/metric-card";
import { FitAmount } from "@/components/ui/fit-amount";
import { ExpenseList } from "@/components/expenses/expense-list";
import { CategoryBreakdown } from "@/components/expenses/category-breakdown";
import { EmptyStateDashboard } from "@/components/dashboard/empty-state";
import { getCurrentUser } from "@/lib/data/user";
import { getExpenseSummary } from "@/lib/data/expenses";
import { hasAnyExpenses } from "@/lib/data/onboarding";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/layout/page-header";
import type { Expense, Category } from "@/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  const t = await getTranslations("dashboard");

  const hasExpenses = await hasAnyExpenses(user.id);
  if (!hasExpenses) {
    return <EmptyStateDashboard userName={user.name ?? "there"} />;
  }

  const locale = await getLocale();
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: user.timezone ?? "UTC",
  }).format(new Date());

  return (
    <div className="animate-page-in space-y-5 md:space-y-6">
      <PageHeader
        title={t("greeting", { name: user.name ?? "there" })}
        subtitle={t("overview")}
      />

      <Suspense fallback={<MetricCardSkeleton />}>
        <DashboardMetric
          userId={user.id}
          baseCurrency={user.baseCurrency}
          monthLabel={monthLabel}
        />
      </Suspense>

      <div className="grid grid-cols-1 items-start gap-5 md:gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
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
  monthLabel,
}: {
  userId: string;
  baseCurrency: string;
  monthLabel: string;
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
    <div>
      <MetricCard
        label={`${t("totalSpent")} · ${monthLabel}`}
        value={formatCurrency(totalSpent, baseCurrency)}
        aside={
          <dl className="border-border-subtle grid min-w-0 shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-x-8 gap-y-1 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <div>
              <dt className="text-text-tertiary text-xs font-medium">
                {t("expenseCount")}
              </dt>
              <dd className="text-text-primary mt-1 text-lg font-semibold tabular-nums">
                {summary.expenseCount}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-text-tertiary text-xs font-medium">
                {t("lastMonth")}
              </dt>
              <dd className="mt-1">
                <FitAmount className="text-text-primary text-lg font-semibold tabular-nums">
                  {formatCurrency(lastMonthTotal, baseCurrency)}
                </FitAmount>
              </dd>
            </div>
          </dl>
        }
        trend={
          lastMonthTotal > 0 &&
          !summary.pendingConversionCount &&
          !summary.lastMonthPendingConversionCount
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
      <ConversionNotice count={summary.pendingConversionCount} />
    </div>
  );
}

async function DashboardCategoryBreakdown({ userId }: { userId: string }) {
  const t = await getTranslations("dashboard");
  const summary = await getExpenseSummary(userId);
  const expenses: Expense[] = summary.recentExpenses.map(mapExpense);

  return (
    <SectionCard
      title={t("byCategory")}
      action={<CardLink href="/categories">{t("allCategories")}</CardLink>}
    >
      {expenses.length === 0 ? (
        <p className="text-text-tertiary py-8 text-center text-sm">
          {t("noExpensesMonth")}
        </p>
      ) : (
        <CategoryBreakdown expenses={expenses} />
      )}
    </SectionCard>
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
    <SectionCard
      title={t("recentExpenses")}
      action={<CardLink href="/expenses">{t("viewAll")}</CardLink>}
    >
      {expenses.length === 0 ? (
        <p className="text-text-tertiary py-8 text-center text-sm">
          {t("noExpensesMonth")}
        </p>
      ) : (
        <ExpenseList expenses={expenses.slice(0, 8)} />
      )}
    </SectionCard>
  );
}

function CardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-accent-primary hover:bg-accent-soft -mr-2 inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[13px] font-medium transition-colors"
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-5 md:p-7">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-3 h-9 w-56" />
      <Skeleton className="mt-3 h-6 w-40 rounded-full" />
    </div>
  );
}

function CategoryBreakdownSkeleton() {
  return (
    <div className="bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-5 md:p-6">
      <Skeleton className="mb-5 h-5 w-28" />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentExpensesSkeleton() {
  return (
    <div className="bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-5 md:p-6">
      <Skeleton className="mb-5 h-5 w-36" />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
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
    baseAmount: e.baseAmount,
    conversionPending: e.conversionPending,
    baseCurrency: e.baseCurrency ?? "USD",
    description: e.description,
    date: e.date.toISOString(),
    categoryId: e.categoryId,
    category: e.category as Category,
  };
}
