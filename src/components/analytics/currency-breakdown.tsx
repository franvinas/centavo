import type { CurrencySpending } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";

interface CurrencyBreakdownProps {
  data: CurrencySpending[];
  baseCurrency: string;
}

export function CurrencyBreakdown({
  data,
  baseCurrency,
}: CurrencyBreakdownProps) {
  if (data.length === 0) {
    return (
      <p className="text-text-tertiary py-12 text-center text-sm">
        No spending data for this period.
      </p>
    );
  }

  const maxTotal = data[0]?.baseTotal ?? 1;

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.currency}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-text-primary text-sm font-medium">
              {item.currency}
            </span>
            <span className="text-text-secondary text-sm">
              {formatCurrency(item.originalTotal, item.currency)}
              {item.currency !== baseCurrency && (
                <span className="text-text-tertiary ml-1">
                  ({formatCurrency(item.baseTotal, baseCurrency)})
                </span>
              )}
            </span>
          </div>
          <div className="bg-bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-accent-primary h-full rounded-full transition-all"
              style={{
                width: `${(item.baseTotal / maxTotal) * 100}%`,
              }}
            />
          </div>
          <p className="text-text-tertiary mt-0.5 text-xs">
            {formatNumber(item.count)} transaction{item.count !== 1 ? "s" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
