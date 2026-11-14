"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Hash, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_EXPENSE,
  normalizeTagName,
} from "@/lib/validations/tag";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}

const MAX_SUGGESTIONS = 6;

function rank(name: string, query: string) {
  if (name === query) return 0;
  return name.startsWith(query) ? 1 : 2;
}

export function TagInput({ value, onChange, suggestions }: TagInputProps) {
  const t = useTranslations("expenses");
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const atLimit = value.length >= MAX_TAGS_PER_EXPENSE;
  const query = normalizeTagName(draft);

  const options = useMemo(() => {
    const available = suggestions.filter((name) => !value.includes(name));
    const matches = query
      ? available
          .filter((name) => name.includes(query))
          .sort((a, b) => rank(a, query) - rank(b, query))
      : available;
    const list = matches
      .slice(0, MAX_SUGGESTIONS)
      .map((name) => ({ name, isNew: false }));
    // The literal text goes first so Enter adds exactly what was typed.
    if (query && !value.includes(query) && !suggestions.includes(query)) {
      list.unshift({ name: query, isNew: true });
    }
    return list;
  }, [query, suggestions, value]);

  const showList = open && !atLimit && options.length > 0;

  function addTags(raw: string) {
    const next = [...value];
    for (const part of raw.split(/[,;]/)) {
      const name = normalizeTagName(part).slice(0, MAX_TAG_LENGTH).trim();
      if (!name || next.includes(name)) continue;
      if (next.length >= MAX_TAGS_PER_EXPENSE) break;
      next.push(name);
    }
    if (next.length !== value.length) onChange(next);
    setDraft("");
    setHighlight(0);
  }

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name));
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const showing = showList;
    if (e.key === "ArrowDown" && showing) {
      e.preventDefault();
      setHighlight((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp" && showing) {
      e.preventDefault();
      setHighlight((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === "," || e.key === ";") {
      if (!draft.trim() && e.key === "Enter" && !showing) return;
      e.preventDefault();
      const picked = showing && draft.trim() ? options[highlight] : undefined;
      addTags(picked ? picked.name : draft);
    } else if (e.key === "Tab" && draft.trim()) {
      e.preventDefault();
      addTags(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Popover
      open={showList}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          data-slot="tag-input"
          className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-1.5 py-2"
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag) => (
            <span
              key={tag}
              data-slot="tag-chip"
              className="bg-bg-muted text-text-primary inline-flex h-7 max-w-full items-center gap-0.5 rounded-full pr-1 pl-2.5 text-[13px] font-medium"
            >
              <span className="text-text-tertiary">#</span>
              <span className="truncate">{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                aria-label={t("removeTag", { tag })}
                className="text-text-tertiary hover:text-text-primary hover:bg-bg-surface flex h-5 w-5 items-center justify-center rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={draft}
            disabled={atLimit}
            onChange={(e) => {
              const next = e.target.value;
              if (/[,;]/.test(next)) {
                addTags(next);
              } else {
                setDraft(next.slice(0, MAX_TAG_LENGTH + 1));
                setHighlight(0);
                setOpen(true);
              }
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
              if (draft.trim()) addTags(draft);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              atLimit
                ? t("tagLimit", { max: MAX_TAGS_PER_EXPENSE })
                : value.length === 0
                  ? t("addTagsPlaceholder")
                  : ""
            }
            aria-label={t("tags")}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint="done"
            className="text-text-primary placeholder:text-muted-foreground h-8 min-w-[8rem] flex-1 bg-transparent text-[15px] outline-none disabled:cursor-not-allowed"
          />
        </div>
      </PopoverAnchor>

      {/* Floats in a portal so opening/closing never shifts the form layout. */}
      <PopoverContent
        align="start"
        sideOffset={2}
        className="w-(--radix-popover-trigger-width) min-w-56 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <ul id={listId} role="listbox" className="max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <li
              key={`${option.isNew ? "new" : "tag"}-${option.name}`}
              role="option"
              aria-selected={index === highlight}
              onMouseDown={(e) => {
                // Keep focus in the input so blur doesn't commit the draft.
                e.preventDefault();
                addTags(option.name);
              }}
              onMouseEnter={() => setHighlight(index)}
              className={`flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm ${
                index === highlight ? "bg-bg-muted" : ""
              }`}
            >
              {option.isNew ? (
                <>
                  <Plus className="text-accent-primary h-4 w-4" />
                  <span className="text-text-primary truncate">
                    {t("addTag", { tag: option.name })}
                  </span>
                </>
              ) : (
                <>
                  <Hash className="text-text-tertiary h-4 w-4" />
                  <span className="text-text-primary truncate">
                    {option.name}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
