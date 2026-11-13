import type { Expense } from "@/types";
import { formatCurrency } from "@/lib/format";
import { categoryIconMap } from "@/lib/category-icon-map";

interface CategoryBreakdownProps {
  expenses: Expense[];
}

interface CategoryTotal {
  name: string;
  color: string;
  icon?: string;
  total: number;
}

export function CategoryBreakdown({ expenses }: CategoryBreakdownProps) {
  const totals = new Map<string, CategoryTotal>();

  for (const expense of expenses) {
    if (expense.baseAmount === null) continue;
    const existing = totals.get(expense.categoryId);
    if (existing) {
      existing.total += expense.baseAmount;
    } else {
      totals.set(expense.categoryId, {
        name: expense.category.name,
        color: expense.category.color,
        icon: expense.category.icon,
        total: expense.baseAmount,
      });
    }
  }

  const sorted = Array.from(totals.values()).sort((a, b) => b.total - a.total);
  const maxTotal = sorted[0]?.total || 1;
  const grandTotal = sorted.reduce((sum, cat) => sum + cat.total, 0) || 1;

  return (
    <div className="space-y-3">
      {sorted.map((cat) => {
        const Icon = cat.icon ? categoryIconMap[cat.icon] : undefined;
        const share = Math.round((cat.total / grandTotal) * 100);
        return (
          <div key={cat.name} className="flex items-center gap-3 py-0.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: `${cat.color}1F` }}
            >
              {Icon ? (
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{ color: cat.color }}
                />
              ) : (
                <span
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{ backgroundColor: cat.color }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-text-primary truncate text-sm font-medium">
                  {cat.name}
                </span>
                <span className="text-text-secondary shrink-0 text-sm tabular-nums">
                  <span className="text-text-tertiary mr-2 text-xs">
                    {share}%
                  </span>
                  {formatCurrency(
                    cat.total,
                    expenses[0]?.baseCurrency ?? "USD",
                  )}
                </span>
              </div>
              <div className="bg-bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${(cat.total / maxTotal) * 100}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
