"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type { AnalyticsData } from "@/types/analytics";
import { PeriodSelector } from "@/components/analytics/period-selector";
import { ConversionNotice } from "@/components/expenses/conversion-notice";
import { SummaryCards } from "@/components/analytics/summary-cards";
import { CurrencyBreakdown } from "@/components/analytics/currency-breakdown";
import { TagBreakdown } from "@/components/analytics/tag-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

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
    <div className="animate-page-in space-y-5 md:space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className={cardClass}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-text-primary text-[15px] font-semibold">
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
        <ConversionNotice
          count={data.overTime.reduce(
            (count, point) => count + (point.pendingConversionCount ?? 0),
            0,
          )}
        />
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

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="text-text-primary text-lg font-semibold tracking-tight first-letter:uppercase">
          {data.periodLabel}
        </h2>
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

      <ConversionNotice count={data.summary.pendingConversionCount ?? 0} />
      <div className="grid grid-cols-1 items-start gap-5 md:gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className={cardClass}>
          <h2 className="text-text-primary mb-5 text-[15px] font-semibold">
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

        <div className="space-y-5 md:space-y-6">
          <div className={cardClass} data-slot="tag-breakdown-card">
            <h2 className="text-text-primary mb-5 text-[15px] font-semibold">
              {t("byTag")}
            </h2>
            {isPending ? (
              <ListSkeleton rows={3} />
            ) : (
              <TagBreakdown
                data={data.byTag}
                baseCurrency={data.baseCurrency}
                from={data.periodFrom}
                to={data.periodTo}
              />
            )}
          </div>

          <div className={cardClass}>
            <h2 className="text-text-primary mb-5 text-[15px] font-semibold">
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
    </div>
  );
}

const cardClass =
  "bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-5 md:p-6";

const skeletonHeights = [58, 42, 75, 33, 67, 50, 83, 39];

function ChartSkeleton() {
  return (
    <div className="flex h-[280px] items-end gap-3 pb-6 pl-12">
      {skeletonHeights.map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-md rounded-b-sm"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className={`bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-4 md:p-5 ${
            i === 0 ? "col-span-2 lg:col-span-1" : ""
          }`}
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

function PieChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 xl:flex-row">
      <Skeleton className="h-[200px] w-[200px] shrink-0 rounded-full" />
      <div className="w-full flex-1 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
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
