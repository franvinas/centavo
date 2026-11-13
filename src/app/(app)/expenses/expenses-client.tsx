"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseList } from "@/components/expenses/expense-list";
import { PageHeader } from "@/components/layout/page-header";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();
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
    <div className="animate-page-in space-y-5">
      <PageHeader title={t("title")} subtitle={t("found", { count: total })} />

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

      <div
        aria-busy={isPending}
        className={`bg-bg-surface shadow-card border-border-subtle/60 rounded-2xl border p-4 transition-opacity md:p-6 ${
          isPending ? "opacity-60" : ""
        }`}
      >
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <SearchX className="text-text-tertiary h-5 w-5" />
            </div>
            <p className="text-text-secondary text-sm">{t("noExpenses")}</p>
          </div>
        ) : (
          <ExpenseList expenses={expenses} />
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3 md:justify-center md:gap-4">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(page - 1));
              startTransition(() => {
                router.push(`/expenses?${params.toString()}`);
              });
            }}
            disabled={page <= 1}
            className="border-border-subtle bg-bg-surface text-text-primary hover:bg-bg-muted inline-flex h-10 items-center gap-1 rounded-xl border pr-4 pl-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("previous")}
          </button>
          <span className="text-text-secondary text-sm tabular-nums">
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
            className="border-border-subtle bg-bg-surface text-text-primary hover:bg-bg-muted inline-flex h-10 items-center gap-1 rounded-xl border pr-3 pl-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
