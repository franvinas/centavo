import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend.positive ? (
            <TrendingDown className="h-4 w-4 text-status-positive" />
          ) : (
            <TrendingUp className="h-4 w-4 text-status-negative" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.positive
                ? "text-status-positive"
                : "text-status-negative"
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
