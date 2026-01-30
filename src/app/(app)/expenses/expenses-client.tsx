"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseList } from "@/components/expenses/expense-list";
import type { Expense, Category } from "@/types";

interface ExpensesClientProps {
  expenses: Expense[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}

export function ExpensesClient({
  expenses,
  categories,
  total,
  page,
  totalPages,
}: ExpensesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset page on filter change
      router.push(`/expenses?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-semibold">
          All Expenses
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          {total} expense{total !== 1 ? "s" : ""} found
        </p>
      </div>

      <ExpenseFilters
        search={searchParams.get("search") ?? ""}
        onSearchChange={(v) => updateParam("search", v)}
        categoryId={searchParams.get("categoryId") ?? ""}
        onCategoryChange={(v) => updateParam("categoryId", v)}
        dateFrom={searchParams.get("from") ?? ""}
        onDateFromChange={(v) => updateParam("from", v)}
        dateTo={searchParams.get("to") ?? ""}
        onDateToChange={(v) => updateParam("to", v)}
        categories={categories}
      />

      <div className="bg-bg-surface shadow-card rounded-lg p-5">
        {expenses.length === 0 ? (
          <p className="text-text-tertiary py-8 text-center text-sm">
            No expenses found
          </p>
        ) : (
          <ExpenseList expenses={expenses} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(page - 1));
              router.push(`/expenses?${params.toString()}`);
            }}
            disabled={page <= 1}
            className="text-accent-primary disabled:text-text-tertiary text-sm font-medium"
          >
            Previous
          </button>
          <span className="text-text-secondary text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(page + 1));
              router.push(`/expenses?${params.toString()}`);
            }}
            disabled={page >= totalPages}
            className="text-accent-primary disabled:text-text-tertiary text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
