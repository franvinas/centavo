"use client";

import { useState } from "react";
import { ChevronRight, Check, Search, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { categoryIconMap } from "@/lib/category-icon-map";
import type { Category } from "@/types";

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function TriggerContent({
  selected,
  placeholder,
}: {
  selected: Category | undefined;
  placeholder: string;
}) {
  return (
    <>
      <Tag className="text-text-tertiary h-5 w-5 shrink-0" />
      <span className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2">
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selected.color }}
            />
            <span className="text-text-primary truncate text-[15px]">
              {selected.name}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground text-[15px]">
            {placeholder}
          </span>
        )}
        <ChevronRight className="text-text-tertiary h-4 w-4 shrink-0" />
      </span>
    </>
  );
}

function CategoryList({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {categories.map((cat) => {
        const Icon = categoryIconMap[cat.icon];
        const isSelected = cat.id === selectedId;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors ${
              isSelected
                ? "bg-accent-soft"
                : "hover:bg-bg-muted active:bg-bg-muted"
            }`}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: `${cat.color}1F` }}
            >
              {Icon && (
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{ color: cat.color }}
                />
              )}
            </span>
            <span className="text-text-primary flex-1 text-left text-sm font-medium">
              {cat.name}
            </span>
            {isSelected && (
              <Check className="text-accent-primary h-5 w-5 shrink-0" />
            )}
          </button>
        );
      })}
    </>
  );
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const t = useTranslations("expenses");

  const selected = categories.find((c) => c.id === selectedId);

  const filtered = search
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

  const handleSelect = (id: string) => {
    onSelect(id);
    setDrawerOpen(false);
    setPopoverOpen(false);
    setSearch("");
  };

  const searchInput = (
    <div className="bg-bg-muted focus-within:ring-ring/40 flex h-11 items-center gap-2 rounded-xl px-3 focus-within:ring-2 md:h-10">
      <Search className="text-text-tertiary h-4 w-4 shrink-0" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("searchCategories")}
        className="text-text-primary placeholder:text-text-tertiary w-full bg-transparent text-base outline-none md:text-sm"
      />
    </div>
  );

  return (
    <>
      {/* Mobile: Drawer */}
      <div className="min-w-0 flex-1 md:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-3 text-left outline-none"
            >
              <TriggerContent
                selected={selected}
                placeholder={t("selectCategory")}
              />
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-lg">{t("category")}</DrawerTitle>
            </DrawerHeader>

            <div className="px-4 pb-2">{searchInput}</div>

            <div className="max-h-[60vh] overflow-y-auto px-4 pt-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <CategoryList
                categories={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: Popover */}
      <div className="hidden min-w-0 flex-1 md:block">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-3 text-left outline-none"
            >
              <TriggerContent
                selected={selected}
                placeholder={t("selectCategory")}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-80 rounded-2xl p-0"
          >
            <div className="p-3">{searchInput}</div>

            <div className="max-h-64 overflow-y-auto px-2 pb-2">
              <CategoryList
                categories={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
