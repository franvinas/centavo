"use client";

import { categoryIconMap, availableIcons } from "@/lib/category-icon-map";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {availableIcons.map((iconName) => {
        const Icon = categoryIconMap[iconName];
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`flex h-10 w-10 items-center justify-center rounded-md border-2 transition-colors ${
              selected ? "border-current" : "border-border-subtle"
            }`}
            style={{ color: selected ? color : undefined }}
            aria-label={`Select icon ${iconName}`}
          >
            {Icon && (
              <Icon
                className={`h-5 w-5 ${selected ? "" : "text-text-tertiary"}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
