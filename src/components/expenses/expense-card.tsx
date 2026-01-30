import type { Expense } from "@/types";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import Link from "next/link";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="flex items-center gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-bg-muted"
    >
      {/* Category dot */}
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: expense.category.color }}
      />

      {/* Description + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {expense.description}
        </p>
        <p className="text-xs text-text-tertiary">
          {expense.category.name} &middot; {formatRelativeDate(expense.date)}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-text-primary">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
        {expense.currency !== expense.baseCurrency && (
          <p className="text-xs text-text-tertiary">{expense.currency}</p>
        )}
      </div>
    </Link>
  );
}
