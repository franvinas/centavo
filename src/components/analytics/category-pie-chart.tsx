"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";
import type { CategorySpending } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";

interface CategoryPieChartProps {
  data: CategorySpending[];
  baseCurrency: string;
}

function CustomTooltip({
  active,
  payload,
  baseCurrency,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategorySpending }>;
  baseCurrency: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-bg-surface shadow-card rounded-lg border px-3 py-2 text-sm">
      <p className="text-text-primary font-medium">{item.name}</p>
      <p className="text-text-secondary">
        {formatCurrency(item.total, baseCurrency)} ({formatNumber(item.count)}{" "}
        expense{item.count !== 1 ? "s" : ""})
      </p>
    </div>
  );
}

export function CategoryPieChart({
  data,
  baseCurrency,
}: CategoryPieChartProps) {
  const t = useTranslations("analytics");

  if (data.length === 0) {
    return (
      <p className="text-text-tertiary py-12 text-center text-sm">
        {t("noSpendingData")}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
        >
          {data.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
