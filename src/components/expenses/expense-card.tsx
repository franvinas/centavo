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

const MAX_VISIBLE_TAGS = 2;

/** Small neutral "#tag" pills; each one links to the expenses filtered by it. */
export function TagChips({ tags }: { tags: string[] }) {
  const te = useTranslations("expenses");
  if (tags.length === 0) return null;
  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const hidden = tags.length - visible.length;

  return (
    <span className="flex min-w-0 items-center gap-1" data-slot="tag-chips">
      {visible.map((tag) => (
        <Link
          key={tag}
          href={`/expenses?tags=${encodeURIComponent(tag)}`}
          aria-label={te("filterByTag", { tag })}
          title={te("filterByTag", { tag })}
          className="bg-bg-muted text-text-secondary hover:text-text-primary hover:bg-border-subtle focus-visible:ring-ring/50 pointer-events-auto relative z-10 inline-flex h-5 min-w-0 items-center truncate rounded-full px-1.5 text-[11px] font-medium outline-none focus-visible:ring-[3px]"
        >
          <span className="truncate">#{tag}</span>
        </Link>
      ))}
      {hidden > 0 && (
        <span className="text-text-tertiary shrink-0 text-[11px] font-medium">
          +{hidden}
        </span>
      )}
    </span>
  );
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const te = useTranslations("expenses");
  const showConverted =
    expense.currency !== expense.baseCurrency &&
    expense.baseAmount !== null &&
    !expense.conversionPending;
  const tags = expense.tags ?? [];

  return (
    // The whole row links to the expense via a stretched overlay link, so the
    // tag chips can be their own links without nesting anchors.
    <div className="group md:hover:bg-bg-muted/60 relative flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors [contain-intrinsic-size:0_60px] [content-visibility:auto] md:-mx-2">
      <Link
        href={`/expenses/${expense.id}`}
        aria-label={expense.description}
        className="focus-visible:ring-ring/50 absolute inset-0 rounded-xl outline-none focus-visible:ring-[3px]"
      />
      <CategoryIconChip
        icon={expense.category.icon}
        color={expense.category.color}
      />

      {/* Description keeps a minimum width; a very long amount wraps below. */}
      <div className="pointer-events-none flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1">
        {/* Description + meta */}
        <div className="min-w-0 flex-[1_1_7rem]">
          <p className="text-text-primary truncate text-[15px] leading-snug font-medium">
            {expense.description}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <p className="text-text-tertiary max-w-[60%] shrink-0 truncate text-xs">
              {expense.category.name}
            </p>
            <TagChips tags={tags} />
          </div>
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
      </div>
    </div>
  );
}
