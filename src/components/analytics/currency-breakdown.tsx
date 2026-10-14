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
          <ConversionNotice count={item.pendingConversionCount ?? 0} />
          <p className="text-text-tertiary mt-0.5 text-xs">
            {t("transactionCount", { count: item.count })}
          </p>
        </div>
      ))}
    </div>
  );
}
