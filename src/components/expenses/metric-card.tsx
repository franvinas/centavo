import { TrendingUp, TrendingDown } from "lucide-react";
import { FitAmount } from "@/components/ui/fit-amount";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  /** Optional secondary facts shown beside (desktop) or below (mobile) the value. */
  aside?: React.ReactNode;
}

export function MetricCard({ label, value, trend, aside }: MetricCardProps) {
  return (
    <div className="bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-5 md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <p className="text-text-secondary text-sm font-medium">{label}</p>
          <FitAmount className="text-text-primary mt-1.5 text-[32px] leading-none font-bold tracking-tight tabular-nums md:text-[40px]">
            {value}
          </FitAmount>
          {trend && (
            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                trend.positive
                  ? "bg-status-positive/10"
                  : "bg-status-negative/10"
              }`}
            >
              {trend.positive ? (
                <TrendingDown className="text-status-positive h-3.5 w-3.5" />
              ) : (
                <TrendingUp className="text-status-negative h-3.5 w-3.5" />
              )}
              <span
                className={`text-xs font-semibold ${
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
        {aside}
      </div>
    </div>
  );
}
