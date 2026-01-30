"use client";

import type { Category } from "@/types";
import { categoryIconMap } from "@/lib/category-icon-map";

interface CategoryChipProps {
  category: Category;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function CategoryChip({
  category,
  selected,
  onSelect,
}: CategoryChipProps) {
  const Icon = categoryIconMap[category.icon];

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={`flex flex-col items-center gap-1.5 rounded-md border-2 px-2 py-3 transition-colors ${
        selected
          ? "border-current"
          : "border-border-subtle hover:border-text-tertiary"
      }`}
      style={{ color: selected ? category.color : undefined }}
    >
      {Icon && (
        <Icon
          className={`h-5 w-5 ${selected ? "" : "text-text-tertiary"}`}
          style={selected ? { color: category.color } : undefined}
        />
      )}
      <span
        className={`text-xs font-medium ${
          selected ? "" : "text-text-secondary"
        }`}
      >
        {category.name}
      </span>
    </button>
  );
}
