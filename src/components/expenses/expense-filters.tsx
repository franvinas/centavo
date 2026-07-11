"use client";

import { Search, X } from "lucide-react";
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
    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
      {/* Search */}
      <div className="relative min-[400px]:col-span-2 md:col-span-1">
        <Search className="text-text-tertiary pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="text-text-tertiary hover:text-text-primary absolute inset-y-0 right-3 my-auto h-4 w-4"
            aria-label={t("clearFilters")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="border-input bg-bg-surface text-text-primary h-9 min-w-0 rounded-md border px-3 text-sm"
      >
        <option value="">{t("allCategories")}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Date range */}
      <DateRangePicker
        from={dateFrom}
        to={dateTo}
        onChange={onDateRangeChange}
        placeholder={t("dateRange")}
      />

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-text-secondary hover:text-text-primary h-9 text-xs font-medium min-[400px]:col-span-2 md:col-span-1"
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
