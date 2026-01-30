import type { Expense } from "@/types";
import { ExpenseCard } from "./expense-card";
import { formatDateGroup } from "@/lib/format";

interface ExpenseListProps {
  expenses: Expense[];
}

function groupByDate(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const dateKey = new Date(expense.date).toDateString();
    const existing = groups.get(dateKey) ?? [];
    existing.push(expense);
    groups.set(dateKey, existing);
  }
  return groups;
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const grouped = groupByDate(expenses);

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateKey, group]) => (
        <div key={dateKey}>
          <p className="mb-1 text-xs font-medium text-text-tertiary">
            {formatDateGroup(group[0].date)}
          </p>
          <div className="divide-y divide-border-subtle">
            {group.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
