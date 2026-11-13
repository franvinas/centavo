"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import type { CategorySpending } from "@/types/analytics";
import { formatCurrency } from "@/lib/format";

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
  const t = useTranslations("analytics");
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-bg-surface shadow-elevated border-border-subtle rounded-xl border px-3.5 py-2.5 text-sm">
      <p className="text-text-primary font-medium">{item.name}</p>
      <p className="text-text-secondary tabular-nums">
        {formatCurrency(item.total, baseCurrency)}
        <span className="text-text-tertiary">
          {" · "}
          {t("expenseCount", { count: item.count })}
        </span>
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

  const total = data.reduce((sum, d) => sum + d.total, 0) || 1;

  return (
    <div className="flex flex-col items-center gap-6 xl:flex-row">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <PieChart width={200} height={200}>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={96}
            innerRadius={68}
            paddingAngle={data.length > 1 ? 2 : 0}
            cornerRadius={4}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-text-tertiary text-xs font-medium">
            {t("totalSpent")}
          </span>
          <span className="text-text-primary mt-0.5 max-w-[120px] truncate text-sm font-semibold tabular-nums">
            {formatCurrency(total, baseCurrency)}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {data.map((entry) => (
          <li
            key={entry.categoryId}
            className="flex items-center gap-2.5 text-sm"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-primary min-w-0 flex-1 truncate">
              {entry.name}
            </span>
            <span className="text-text-tertiary w-9 shrink-0 text-right text-xs tabular-nums">
              {Math.round((entry.total / total) * 100)}%
            </span>
            <span className="text-text-secondary shrink-0 text-right tabular-nums">
              {formatCurrency(entry.total, baseCurrency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
