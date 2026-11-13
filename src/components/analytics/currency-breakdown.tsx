"use client";
import { useTranslations } from "next-intl";
import type { CurrencySpending } from "@/types/analytics";
import { ConversionNotice } from "@/components/expenses/conversion-notice";
import { formatCurrency } from "@/lib/format";

interface CurrencyBreakdownProps {
  data: CurrencySpending[];
  baseCurrency: string;
}

export function CurrencyBreakdown({
  data,
  baseCurrency,
}: CurrencyBreakdownProps) {
  const t = useTranslations("analytics");
  if (data.length === 0) {
    return (
      <p className="text-text-tertiary py-12 text-center text-sm">
        {t("noSpendingData")}
      </p>
    );
  }

  const maxTotal = data[0]?.baseTotal || 1;

  return (
    <div className="space-y-5">
      {data.map((item) => (
        <div key={item.currency} className="flex items-start gap-3">
          <span className="bg-bg-muted text-text-secondary flex h-9 w-12 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold tracking-wide">
            {item.currency}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-text-primary text-sm font-semibold tabular-nums">
                {formatCurrency(item.originalTotal, item.currency)}
              </span>
              <span className="text-text-tertiary shrink-0 text-xs">
                {t("transactionCount", { count: item.count })}
              </span>
            </div>
            {item.currency !== baseCurrency && (
              <p className="text-text-tertiary mt-0.5 text-xs tabular-nums">
                ≈ {formatCurrency(item.baseTotal, baseCurrency)}
              </p>
            )}
            <div className="bg-bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-accent-primary h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${(item.baseTotal / maxTotal) * 100}%`,
                }}
              />
            </div>
            <ConversionNotice count={item.pendingConversionCount ?? 0} />
          </div>
        </div>
      ))}
    </div>
  );
}
