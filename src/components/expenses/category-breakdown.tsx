import type { Expense } from "@/types";
import { formatCurrency } from "@/lib/format";

interface CategoryBreakdownProps {
  expenses: Expense[];
}

interface CategoryTotal {
  name: string;
  color: string;
  total: number;
}

export function CategoryBreakdown({ expenses }: CategoryBreakdownProps) {
  const totals = new Map<string, CategoryTotal>();

  for (const expense of expenses) {
    const existing = totals.get(expense.categoryId);
    if (existing) {
      existing.total += expense.baseAmount;
    } else {
      totals.set(expense.categoryId, {
        name: expense.category.name,
        color: expense.category.color,
        total: expense.baseAmount,
      });
    }
  }

  const sorted = Array.from(totals.values()).sort(
    (a, b) => b.total - a.total,
  );
  const maxTotal = sorted[0]?.total ?? 1;

  return (
    <div className="space-y-3">
      {sorted.map((cat) => (
        <div key={cat.name}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              {cat.name}
            </span>
            <span className="text-sm text-text-secondary">
              {formatCurrency(cat.total)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(cat.total / maxTotal) * 100}%`,
                backgroundColor: cat.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
