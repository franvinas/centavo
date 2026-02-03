import type { AnalyticsSummary } from "@/types/analytics";
import { formatCurrency } from "@/lib/format";

interface SummaryCardsProps {
  summary: AnalyticsSummary;
  baseCurrency: string;
}

export function SummaryCards({ summary, baseCurrency }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Spent",
      value: formatCurrency(summary.totalSpent, baseCurrency),
    },
    {
      label: "Transactions",
      value: summary.transactionCount.toString(),
    },
    {
      label: "Daily Average",
      value: formatCurrency(summary.dailyAverage, baseCurrency),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-bg-surface shadow-card rounded-lg p-5"
        >
          <p className="text-text-secondary text-sm font-medium">
            {card.label}
          </p>
          <p className="text-text-primary mt-1 text-2xl font-bold">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
