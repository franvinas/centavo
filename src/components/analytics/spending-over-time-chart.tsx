"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTranslations, useLocale } from "next-intl";
import type { TimeSeriesPoint } from "@/types/analytics";
import { formatCurrency } from "@/lib/format";

interface SpendingOverTimeChartProps {
  data: TimeSeriesPoint[];
  baseCurrency: string;
  onBarClick?: (period: string) => void;
}

function formatMonth(period: string, locale: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString(locale, {
    timeZone: "UTC",
    month: "short",
    year: "2-digit",
  });
}

function formatMonthLong(period: string, locale: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString(locale, {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

function CustomTooltip({
  active,
  payload,
  baseCurrency,
}: {
  active?: boolean;
  payload?: Array<{ payload: TimeSeriesPoint }>;
  baseCurrency: string;
}) {
  const locale = useLocale();
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-bg-surface shadow-elevated border-border-subtle rounded-xl border px-3.5 py-2.5 text-sm">
      <p className="text-text-tertiary text-xs font-medium first-letter:uppercase">
        {formatMonthLong(item.period, locale)}
      </p>
      <p className="text-text-primary mt-0.5 font-semibold tabular-nums">
        {formatCurrency(item.total, baseCurrency)}
      </p>
    </div>
  );
}

export function SpendingOverTimeChart({
  data,
  baseCurrency,
  onBarClick,
}: SpendingOverTimeChartProps) {
  const locale = useLocale();
  const t = useTranslations("analytics");

  if (data.length === 0) {
    return (
      <p className="text-text-tertiary py-12 text-center text-sm">
        {t("noSpendingData")}
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.period, locale),
  }));

  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e4e1" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9c9b99" }}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9c9b99" }}
          tickLine={false}
          axisLine={false}
          width="auto"
          tickCount={5}
          tickFormatter={(value: number) => compact.format(value)}
        />
        <Tooltip
          content={<CustomTooltip baseCurrency={baseCurrency} />}
          cursor={{ fill: "#edecea", radius: 8 }}
        />
        <Bar
          dataKey="total"
          fill="#3d8a5a"
          radius={[6, 6, 2, 2]}
          maxBarSize={44}
          cursor={onBarClick ? "pointer" : undefined}
          onClick={(barData) => {
            const period = (barData as unknown as { period?: string })?.period;
            if (onBarClick && period) {
              onBarClick(period);
            }
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
