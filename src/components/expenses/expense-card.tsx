"use client";

import { useTranslations } from "next-intl";
import type { Expense } from "@/types";
import { formatCurrency } from "@/lib/format";
import { categoryIconMap } from "@/lib/category-icon-map";
import { isEmojiIcon } from "@/lib/category-icon";
import { categoryTileStyle } from "@/components/categories/category-icon";
import Link from "next/link";

interface ExpenseCardProps {
  expense: Expense;
}

export function CategoryIconChip({
  icon,
  color,
  size = "md",
}: {
  icon?: string;
  color: string;
  size?: "sm" | "md";
}) {
  const Icon = icon ? categoryIconMap[icon] : undefined;
  const emoji = isEmojiIcon(icon);
  const box = size === "sm" ? "h-8 w-8 rounded-[9px]" : "h-10 w-10 rounded-xl";
  return (
    <div
      data-slot="category-chip"
      className={`flex shrink-0 items-center justify-center ${box}`}
      style={categoryTileStyle(icon, color)}
    >
      {emoji ? (
        <span
          aria-hidden="true"
          data-emoji-icon
          className={`leading-none ${size === "sm" ? "text-base" : "text-lg"}`}
        >
          {icon}
        </span>
      ) : Icon ? (
        <Icon
          className={size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"}
          style={{ color }}
        />
      ) : (
        <span
          className="h-2.5 w-2.5 rounded-[3px]"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const te = useTranslations("expenses");
  const showConverted =
    expense.currency !== expense.baseCurrency &&
    expense.baseAmount !== null &&
    !expense.conversionPending;

  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="group md:hover:bg-bg-muted/60 focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors outline-none [contain-intrinsic-size:0_60px] [content-visibility:auto] focus-visible:ring-[3px] md:-mx-2"
    >
      <CategoryIconChip
        icon={expense.category.icon}
        color={expense.category.color}
      />

      {/* Description + meta */}
      <div className="min-w-0 flex-1">
        <p className="text-text-primary truncate text-[15px] leading-snug font-medium">
          {expense.description}
        </p>
        <p className="text-text-tertiary mt-0.5 truncate text-xs">
          {expense.category.name}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right tabular-nums">
        <p className="text-text-primary text-[15px] leading-snug font-semibold">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
        {expense.conversionPending ? (
          <p className="text-status-negative mt-0.5 text-xs">
            {te("conversionPending")}
          </p>
        ) : showConverted ? (
          <p className="text-text-tertiary mt-0.5 text-xs">
            ≈ {formatCurrency(expense.baseAmount!, expense.baseCurrency)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
