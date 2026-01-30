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
    <div className="bg-bg-surface shadow-card rounded-lg p-5">
      <p className="text-text-secondary text-sm font-medium">{label}</p>
      <p className="text-text-primary mt-1 text-2xl font-bold">{value}</p>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend.positive ? (
            <TrendingDown className="text-status-positive h-4 w-4" />
          ) : (
            <TrendingUp className="text-status-negative h-4 w-4" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.positive ? "text-status-positive" : "text-status-negative"
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
