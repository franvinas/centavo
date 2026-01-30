"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types";

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  categories: Category[];
}

export function ExpenseFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  categories,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative min-w-[180px] flex-1">
        <Search className="text-text-tertiary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="border-input bg-bg-surface text-text-primary h-9 rounded-md border px-3 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Date range */}
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="w-36"
        aria-label="From date"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="w-36"
        aria-label="To date"
      />
    </div>
  );
}
