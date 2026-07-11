"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const [, startTransition] = useTransition();
  const t = useTranslations("expenses");
  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [previousUrlSearch, setPreviousUrlSearch] = useState(urlSearch);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  if (urlSearch !== previousUrlSearch) {
    setPreviousUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page"); // reset page on filter change
      const query = params.toString();
      const href = query ? `/expenses?${query}` : "/expenses";
      startTransition(() => {
        router.replace(href);
      });
    },
    [router, searchParams, startTransition],
  );

  const cancelPendingSearch = useCallback(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = null;
  }, []);

  useEffect(() => {
    return cancelPendingSearch;
  }, [cancelPendingSearch, urlSearch]);

  function handleSearchChange(value: string) {
    setSearch(value);
    cancelPendingSearch();
    searchTimeout.current = setTimeout(() => {
      updateParams({ search: value });
      searchTimeout.current = null;
    }, 300);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-semibold">
          {t("title")}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          {t("found", { count: total })}
        </p>
      </div>

      <ExpenseFilters
        search={search}
        onSearchChange={handleSearchChange}
        categoryId={searchParams.get("categoryId") ?? ""}
        onCategoryChange={(categoryId) => {
          cancelPendingSearch();
          updateParams({ search, categoryId });
        }}
        dateFrom={searchParams.get("from") ?? ""}
        dateTo={searchParams.get("to") ?? ""}
        onDateRangeChange={(from, to) => {
          cancelPendingSearch();
          updateParams({ search, from, to });
        }}
        onClearAll={() => {
          cancelPendingSearch();
          setSearch("");
          updateParams({ search: "", categoryId: "", from: "", to: "" });
        }}
        categories={categories}
      />

      <div className="bg-bg-surface shadow-card rounded-lg p-5">
        {expenses.length === 0 ? (
          <p className="text-text-tertiary py-8 text-center text-sm">
            {t("noExpenses")}
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
              startTransition(() => {
                router.push(`/expenses?${params.toString()}`);
              });
            }}
            disabled={page <= 1}
            className="text-accent-primary disabled:text-text-tertiary text-sm font-medium"
          >
            {t("previous")}
          </button>
          <span className="text-text-secondary text-sm">
            {t("page", { page, totalPages })}
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(page + 1));
              startTransition(() => {
                router.push(`/expenses?${params.toString()}`);
              });
            }}
            disabled={page >= totalPages}
            className="text-accent-primary disabled:text-text-tertiary text-sm font-medium"
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}
