"use client";

import { Search, X, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { Category } from "@/types";

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateRangeChange: (from: string, to: string) => void;
  onClearAll: () => void;
  categories: Category[];
}

export function ExpenseFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
  onClearAll,
  categories,
}: ExpenseFiltersProps) {
  const t = useTranslations("expenses");
  const hasActiveFilters = search || categoryId || dateFrom || dateTo;

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[minmax(0,1fr)_200px_200px_auto] md:items-center">
      {/* Search */}
      <div className="relative col-span-2 md:col-span-1">
        <Search className="text-text-tertiary pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-bg-surface border-border-subtle h-11 rounded-xl pr-9 pl-10 shadow-none md:h-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="text-text-tertiary hover:text-text-primary hover:bg-bg-muted absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-lg"
            aria-label={t("clearFilters")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="relative min-w-0">
        <Tag className="text-text-tertiary pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4" />
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label={t("allCategories")}
          className={`select-native border-border-subtle bg-bg-surface focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full min-w-0 truncate rounded-xl border pl-10 text-sm outline-none focus-visible:ring-[3px] md:h-10 ${
            categoryId ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <DateRangePicker
        from={dateFrom}
        to={dateTo}
        onChange={onDateRangeChange}
        placeholder={t("dateRange")}
        className="border-border-subtle bg-bg-surface text-text-secondary h-11 rounded-xl px-3.5 shadow-none md:h-10"
      />

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-accent-primary hover:bg-accent-soft col-span-2 inline-flex h-9 items-center justify-center gap-1 justify-self-start rounded-lg px-2 text-[13px] font-medium transition-colors md:col-span-1 md:h-10 md:px-3"
        >
          <X className="h-3.5 w-3.5" />
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
