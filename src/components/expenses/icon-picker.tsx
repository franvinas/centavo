"use client";

import { useTranslations } from "next-intl";

import { categoryIconMap, availableIcons } from "@/lib/category-icon-map";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  const t = useTranslations("categories");
  return (
    <div className="grid grid-cols-6 gap-2">
      {availableIcons.map((iconName) => {
        const Icon = categoryIconMap[iconName];
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            aria-pressed={selected}
            className={`flex aspect-square w-full max-w-11 items-center justify-center justify-self-center rounded-xl transition-colors ${
              selected ? "ring-2 ring-current ring-inset" : "hover:bg-bg-muted"
            }`}
            style={{
              color: selected ? color : undefined,
              backgroundColor: selected ? `${color}1F` : undefined,
            }}
            aria-label={t("selectIcon", { icon: t(`icons.${iconName}`) })}
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
