"use client";

import { useTranslations } from "next-intl";
import type { AnalyticsSummary } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";

interface SummaryCardsProps {
  summary: AnalyticsSummary;
  baseCurrency: string;
}

export function SummaryCards({ summary, baseCurrency }: SummaryCardsProps) {
  const t = useTranslations("analytics");

  const cards = [
    {
      label: t("totalSpent"),
      value: formatCurrency(summary.totalSpent, baseCurrency),
    },
    {
      label: t("transactions"),
      value: formatNumber(summary.transactionCount),
    },
    {
      label: t("dailyAverage"),
      value: formatCurrency(summary.dailyAverage, baseCurrency),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`bg-bg-surface shadow-card border-border-subtle/60 min-w-0 rounded-2xl border p-4 md:p-5 ${
            i === 0 ? "col-span-2 lg:col-span-1" : ""
          }`}
        >
          <p className="text-text-secondary truncate text-[13px] font-medium">
            {card.label}
          </p>
          <p
            className={`text-text-primary mt-1.5 truncate font-bold tracking-tight tabular-nums ${
              i === 0 ? "text-[26px] md:text-2xl" : "text-xl md:text-2xl"
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
