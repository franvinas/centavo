"use client";

import { useTranslations } from "next-intl";
import type { Expense } from "@/types";
import {
  formatCurrency,
  formatRelativeDate,
  type DateLabels,
} from "@/lib/format";
import Link from "next/link";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const t = useTranslations("dates");

  const labels: DateLabels = {
    today: t("today"),
    yesterday: t("yesterday"),
    daysAgo: (count: number) => t("daysAgo", { count }),
  };

  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="hover:bg-bg-muted flex items-center gap-3 rounded-lg px-1 py-3 transition-colors [contain-intrinsic-size:0_48px] [content-visibility:auto]"
    >
      {/* Category dot */}
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: expense.category.color }}
      />

      {/* Description + meta */}
      <div className="min-w-0 flex-1">
        <p className="text-text-primary truncate text-sm font-medium">
          {expense.description}
        </p>
        <p className="text-text-tertiary text-xs">
          {expense.category.name} &middot;{" "}
          {formatRelativeDate(expense.date, labels)}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right tabular-nums">
        <p className="text-text-primary text-sm font-bold">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
        {expense.currency !== expense.baseCurrency && (
          <p className="text-text-tertiary text-xs">{expense.currency}</p>
        )}
      </div>
    </Link>
  );
}
