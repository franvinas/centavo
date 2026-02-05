"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type { AnalyticsData } from "@/types/analytics";
import { PeriodSelector } from "@/components/analytics/period-selector";
import { SummaryCards } from "@/components/analytics/summary-cards";
import { CurrencyBreakdown } from "@/components/analytics/currency-breakdown";
import { Skeleton } from "@/components/ui/skeleton";

const CategoryPieChart = dynamic(
  () =>
    import("@/components/analytics/category-pie-chart").then(
      (m) => m.CategoryPieChart,
    ),
  {
    ssr: false,
    loading: () => <PieChartSkeleton />,
  },
);

const SpendingOverTimeChart = dynamic(
  () =>
    import("@/components/analytics/spending-over-time-chart").then(
      (m) => m.SpendingOverTimeChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

interface AnalyticsClientProps {
  data: AnalyticsData;
  currentPeriod: string;
  currentFrom: string;
  currentTo: string;
  currentTimePeriod: string;
  currentTimeFrom: string;
  currentTimeTo: string;
}

export function AnalyticsClient({
  data,
  currentPeriod,
  currentFrom,
  currentTo,
  currentTimePeriod,
  currentTimeFrom,
  currentTimeTo,
}: AnalyticsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("analytics");

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/analytics?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const handleBarClick = useCallback(
    (period: string) => {
      // period is "YYYY-MM" — set main filter to custom range covering that month
      const [year, month] = period.split("-").map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const from = firstDay.toISOString().slice(0, 10);
      const to = lastDay.toISOString().slice(0, 10);
      updateParams({ period: "custom", from, to });
    },
    [updateParams],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-semibold">
          {t("title")}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <div className="bg-bg-surface shadow-card rounded-lg p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-text-primary text-base font-semibold">
            {t("spendingOverTime")}
          </h2>
          <PeriodSelector
            period={currentTimePeriod}
            customFrom={currentTimeFrom}
            customTo={currentTimeTo}
            exclude={["this-month"]}
            onPeriodChange={(period) =>
              updateParams({
                timePeriod: period,
                timeFrom: "",
                timeTo: "",
              })
            }
            onCustomFromChange={(from) => updateParams({ timeFrom: from })}
            onCustomToChange={(to) => updateParams({ timeTo: to })}
          />
        </div>
        {isPending ? (
          <ChartSkeleton />
        ) : (
          <SpendingOverTimeChart
            data={data.overTime}
            baseCurrency={data.baseCurrency}
            onBarClick={handleBarClick}
          />
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-text-secondary text-sm">{data.periodLabel}</p>
        <PeriodSelector
          period={currentPeriod}
          customFrom={currentFrom}
          customTo={currentTo}
          onPeriodChange={(period) =>
            updateParams({ period, from: "", to: "" })
          }
          onCustomFromChange={(from) => updateParams({ from })}
          onCustomToChange={(to) => updateParams({ to })}
        />
      </div>

      {isPending ? (
        <SummaryCardsSkeleton />
      ) : (
        <SummaryCards summary={data.summary} baseCurrency={data.baseCurrency} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-bg-surface shadow-card rounded-lg p-5">
          <h2 className="text-text-primary mb-4 text-base font-semibold">
            {t("byCategory")}
          </h2>
          {isPending ? (
            <PieChartSkeleton />
          ) : (
            <CategoryPieChart
              data={data.byCategory}
              baseCurrency={data.baseCurrency}
            />
          )}
        </div>

        <div className="bg-bg-surface shadow-card rounded-lg p-5">
          <h2 className="text-text-primary mb-4 text-base font-semibold">
            {t("byCurrency")}
          </h2>
          {isPending ? (
            <ListSkeleton rows={3} />
          ) : (
            <CurrencyBreakdown
              data={data.byCurrency}
              baseCurrency={data.baseCurrency}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const skeletonHeights = [58, 42, 75, 33, 67, 50, 83, 39];

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] items-end gap-2 px-8 pb-6">
      {skeletonHeights.map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-bg-surface shadow-card rounded-lg p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

function PieChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Skeleton className="h-[200px] w-[200px] rounded-full" />
      <div className="flex gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
