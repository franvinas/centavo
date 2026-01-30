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
          <p className="text-text-tertiary mb-1 text-xs font-medium">
            {formatDateGroup(group[0].date)}
          </p>
          <div className="divide-border-subtle divide-y">
            {group.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
