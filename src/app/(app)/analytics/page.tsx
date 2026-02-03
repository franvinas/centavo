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

export const dynamic = "force-dynamic";

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

  const { from, to, label } = getDateRange(period, customFrom, customTo);
  const {
    from: timeChartFrom,
    to: timeChartTo,
    label: timePeriodLabel,
  } = getDateRange(timePeriod, timeFrom, timeTo);

  const [summary, byCategory, overTime, byCurrency] = await Promise.all([
    getAnalyticsSummary({ userId: user.id, from, to }),
    getSpendingByCategory({ userId: user.id, from, to }),
    getSpendingOverTime({
      userId: user.id,
      from: timeChartFrom,
      to: timeChartTo,
    }),
    getSpendingByCurrency({ userId: user.id, from, to }),
  ]);

  return (
    <AnalyticsClient
      data={{
        summary,
        byCategory,
        overTime,
        byCurrency,
        baseCurrency: user.baseCurrency,
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
