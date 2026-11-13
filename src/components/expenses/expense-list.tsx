"use client";

import { useTranslations, useLocale } from "next-intl";
import type { Expense } from "@/types";
import { ExpenseCard } from "./expense-card";
import { SwipeableExpenseCard } from "./swipeable-expense-card";
import { formatDateGroup, parseLocalDate, type DateLabels } from "@/lib/format";

interface ExpenseListProps {
  expenses: Expense[];
}

function groupByDate(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const dateKey = parseLocalDate(expense.date).toDateString();
    const existing = groups.get(dateKey) ?? [];
    existing.push(expense);
    groups.set(dateKey, existing);
  }
  return groups;
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const locale = useLocale();
  const t = useTranslations("dates");
  const grouped = groupByDate(expenses);

  const labels: DateLabels = {
    locale,
    today: t("today"),
    yesterday: t("yesterday"),
    daysAgo: (count: number) => t("daysAgo", { count }),
  };

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateKey, group]) => (
        <section key={dateKey}>
          <h3 className="text-text-tertiary mb-1 px-0 text-xs font-medium tracking-wide first-letter:uppercase md:px-0">
            {formatDateGroup(group[0].date, labels)}
          </h3>
          <div className="-mx-2 md:mx-0">
            {group.map((expense) => (
              <div key={expense.id}>
                {/* Swipeable on mobile */}
                <SwipeableExpenseCard expense={expense} />
                {/* Regular card on desktop */}
                <div className="hidden md:block">
                  <ExpenseCard expense={expense} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
