"use client";

import { Check, ChevronDown, Hash, Search, X, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  tagNames?: string[];
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
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
  tagNames = [],
  selectedTags = [],
  onTagsChange = () => {},
}: ExpenseFiltersProps) {
  const t = useTranslations("expenses");
  const hasActiveFilters =
    search || categoryId || dateFrom || dateTo || selectedTags.length > 0;

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[minmax(0,1fr)_180px_170px_200px_auto] md:items-center">
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

      {/* Tag filter (matches any selected tag) */}
      <TagFilter
        tagNames={tagNames}
        selected={selectedTags}
        onChange={onTagsChange}
      />

      {/* Date range */}
      <div className="col-span-2 md:col-span-1">
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={onDateRangeChange}
          placeholder={t("dateRange")}
          className="border-border-subtle bg-bg-surface text-text-secondary h-11 w-full rounded-xl px-3.5 shadow-none md:h-10"
        />
      </div>

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

function TagFilter({
  tagNames,
  selected,
  onChange,
}: {
  tagNames: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const t = useTranslations("expenses");
  // Keep tags from the URL visible even if they no longer exist.
  const options = [...new Set([...tagNames, ...selected])].sort();
  const label =
    selected.length === 0
      ? t("allTags")
      : selected.length === 1
        ? `#${selected[0]}`
        : t("selectedTags", { count: selected.length });

  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter((item) => item !== tag)
        : [...selected, tag],
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("tags")}
          data-slot="tag-filter"
          className={`border-border-subtle bg-bg-surface focus-visible:border-ring focus-visible:ring-ring/50 relative flex h-11 w-full min-w-0 items-center rounded-xl border pr-9 pl-10 text-left text-sm outline-none focus-visible:ring-[3px] md:h-10 ${
            selected.length ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          <Hash className="text-text-tertiary pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4" />
          <span className="truncate">{label}</span>
          <ChevronDown className="text-text-tertiary pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5">
        {options.length === 0 ? (
          <p className="text-text-tertiary px-2.5 py-3 text-sm">
            {t("noTagsYet")}
          </p>
        ) : (
          <>
            <ul
              className="max-h-64 overflow-y-auto"
              role="listbox"
              aria-multiselectable
            >
              {options.map((tag) => {
                const checked = selected.includes(tag);
                return (
                  <li key={tag} role="option" aria-selected={checked}>
                    <button
                      type="button"
                      onClick={() => toggle(tag)}
                      className="hover:bg-bg-muted flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "bg-accent-primary border-accent-primary text-white"
                            : "border-border-subtle"
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="text-text-primary truncate">#{tag}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-accent-primary hover:bg-accent-soft border-border-subtle mt-1 flex h-9 w-full items-center justify-center rounded-lg border-t text-[13px] font-medium"
              >
                {t("clearTags")}
              </button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
