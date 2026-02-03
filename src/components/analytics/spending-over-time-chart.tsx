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
import type { TimeSeriesPoint } from "@/types/analytics";
import { formatCurrency } from "@/lib/format";

interface SpendingOverTimeChartProps {
  data: TimeSeriesPoint[];
  baseCurrency: string;
  onBarClick?: (period: string) => void;
}

function formatMonth(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
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
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-bg-surface shadow-card rounded-lg border px-3 py-2 text-sm">
      <p className="text-text-primary font-medium">
        {formatMonth(item.period)}
      </p>
      <p className="text-text-secondary">
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
  if (data.length === 0) {
    return (
      <p className="text-text-tertiary py-12 text-center text-sm">
        No spending data for this period.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.period),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={(value: number) =>
            value >= 1_000_000
              ? `${(value / 1_000_000).toFixed(0)}M`
              : value >= 1000
                ? `${(value / 1000).toFixed(0)}k`
                : String(value)
          }
        />
        <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
        <Bar
          dataKey="total"
          fill="#3D8A5A"
          radius={[4, 4, 0, 0]}
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
