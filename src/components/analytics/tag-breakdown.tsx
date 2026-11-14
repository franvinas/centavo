"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { TagSpending } from "@/types/analytics";
import { ConversionNotice } from "@/components/expenses/conversion-notice";
import { formatCurrency } from "@/lib/format";

interface TagBreakdownProps {
  data: TagSpending[];
  baseCurrency: string;
  /** Selected period as YYYY-MM-DD. */
  from: string;
  to: string;
}

export function TagBreakdown({
  data,
  baseCurrency,
  from,
  to,
}: TagBreakdownProps) {
  const t = useTranslations("analytics");

  if (data.length === 0) {
    return (
      <p className="text-text-tertiary py-8 text-center text-sm">
        {t("noTagData")}
      </p>
    );
  }

  const maxTotal = Math.max(...data.map((item) => item.total)) || 1;

  return (
    <div>
      <ul className="-mx-2 space-y-1" data-slot="tag-breakdown">
        {data.map((item) => {
          const params = new URLSearchParams({ tags: item.name, from, to });
          return (
            <li key={item.tagId}>
              <Link
                href={`/expenses?${params.toString()}`}
                aria-label={t("viewTagExpenses", { tag: item.name })}
                className="hover:bg-bg-muted/60 block rounded-xl px-2 py-2"
              >
                {/* The name keeps a minimum width; a long amount wraps below it. */}
                <div className="flex flex-wrap items-baseline justify-end gap-x-3">
                  <span className="text-text-primary min-w-0 flex-[1_1_4.5rem] truncate text-sm font-medium">
                    <span className="text-text-tertiary">#</span>
                    {item.name}
                  </span>
                  <span className="text-text-primary shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(item.total, baseCurrency)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="bg-bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-accent-primary h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${(item.total / maxTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-text-tertiary shrink-0 text-xs tabular-nums">
                    {t("transactionCount", { count: item.count })}
                  </span>
                </div>
                <ConversionNotice count={item.pendingConversionCount ?? 0} />
              </Link>
            </li>
          );
        })}
      </ul>
      {data.length > 1 && (
        <p className="text-text-tertiary mt-4 text-xs">{t("tagOverlapHint")}</p>
      )}
    </div>
  );
}
