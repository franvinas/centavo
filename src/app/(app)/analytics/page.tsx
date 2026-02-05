import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/data/user";
import { hasAnyExpenses } from "@/lib/data/onboarding";
import { getDateRange } from "@/lib/analytics-periods";
import {
  getAnalyticsSummary,
  getSpendingByCategory,
  getSpendingOverTime,
  getSpendingByCurrency,
} from "@/lib/data/analytics";
import { AnalyticsClient } from "./analytics-client";
import AnalyticsLoading from "./loading";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  const t = await getTranslations("analytics");

  const params = await searchParams;
  const period =
    typeof params.period === "string" ? params.period : "this-month";
  const customFrom = typeof params.from === "string" ? params.from : undefined;
  const customTo = typeof params.to === "string" ? params.to : undefined;

  const hasExpenses = await hasAnyExpenses(user.id);

  if (!hasExpenses) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-text-primary text-2xl font-semibold">
            {t("title")}
          </h1>
          <p className="text-text-secondary mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <div className="bg-bg-surface shadow-card rounded-lg p-8 text-center">
          <p className="text-text-tertiary text-sm">{t("noExpenses")}</p>
        </div>
      </div>
    );
  }

  const timePeriod =
    typeof params.timePeriod === "string"
      ? params.timePeriod
      : "last-12-months";
  const timeFrom =
    typeof params.timeFrom === "string" ? params.timeFrom : undefined;
  const timeTo = typeof params.timeTo === "string" ? params.timeTo : undefined;

  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent
        userId={user.id}
        baseCurrency={user.baseCurrency}
        period={period}
        customFrom={customFrom}
        customTo={customTo}
        timePeriod={timePeriod}
        timeFrom={timeFrom}
        timeTo={timeTo}
      />
    </Suspense>
  );
}

async function AnalyticsContent({
  userId,
  baseCurrency,
  period,
  customFrom,
  customTo,
  timePeriod,
  timeFrom,
  timeTo,
}: {
  userId: string;
  baseCurrency: string;
  period: string;
  customFrom: string | undefined;
  customTo: string | undefined;
  timePeriod: string;
  timeFrom: string | undefined;
  timeTo: string | undefined;
}) {
  const { from, to, label } = getDateRange(period, customFrom, customTo);
  const {
    from: timeChartFrom,
    to: timeChartTo,
    label: timePeriodLabel,
  } = getDateRange(timePeriod, timeFrom, timeTo);

  const [summary, byCategory, overTime, byCurrency] = await Promise.all([
    getAnalyticsSummary({ userId, from, to }),
    getSpendingByCategory({ userId, from, to }),
    getSpendingOverTime({
      userId,
      from: timeChartFrom,
      to: timeChartTo,
    }),
    getSpendingByCurrency({ userId, from, to }),
  ]);

  return (
    <AnalyticsClient
      data={{
        summary,
        byCategory,
        overTime,
        byCurrency,
        baseCurrency,
        periodLabel: label,
        timePeriodLabel,
      }}
      currentPeriod={period}
      currentFrom={customFrom ?? ""}
      currentTo={customTo ?? ""}
      currentTimePeriod={timePeriod}
      currentTimeFrom={timeFrom ?? ""}
      currentTimeTo={timeTo ?? ""}
    />
  );
}
