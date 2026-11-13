"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { categoryIconMap, availableIcons } from "@/lib/category-icon-map";
import {
  SUGGESTED_EMOJIS,
  extractEmoji,
  isEmojiIcon,
} from "@/lib/category-icon";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color: string;
}

type Mode = "icons" | "emoji";

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  const t = useTranslations("categories");
  const valueIsEmoji = isEmojiIcon(value);
  const [mode, setMode] = useState<Mode>(valueIsEmoji ? "emoji" : "icons");
  const [emojiDraft, setEmojiDraft] = useState("");
  const [emojiError, setEmojiError] = useState(false);

  function handleEmojiInput(input: string) {
    setEmojiDraft(input);
    if (!input.trim()) {
      setEmojiError(false);
      return;
    }
    const emoji = extractEmoji(input);
    if (emoji) {
      setEmojiError(false);
      setEmojiDraft("");
      onChange(emoji);
    } else {
      setEmojiError(true);
    }
  }

  const tabClass = (active: boolean) =>
    cn(
      "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-bg-surface text-text-primary shadow-subtle"
        : "text-text-secondary hover:text-text-primary",
    );

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label={t("icon")}
        className="bg-bg-muted flex gap-1 rounded-xl p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "icons"}
          onClick={() => setMode("icons")}
          className={tabClass(mode === "icons")}
        >
          {t("iconTabIcons")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "emoji"}
          onClick={() => setMode("emoji")}
          className={tabClass(mode === "emoji")}
        >
          {t("iconTabEmoji")}
        </button>
      </div>

      {mode === "icons" ? (
        <div role="tabpanel" className="grid grid-cols-6 gap-2">
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
                  selected
                    ? "ring-2 ring-current ring-inset"
                    : "hover:bg-bg-muted"
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
      ) : (
        <div role="tabpanel" className="space-y-3">
          <input
            type="text"
            inputMode="text"
            enterKeyHint="done"
            autoComplete="off"
            value={emojiDraft}
            onChange={(e) => handleEmojiInput(e.target.value)}
            placeholder={t("emojiPlaceholder")}
            aria-label={t("emojiPlaceholder")}
            aria-invalid={emojiError}
            className="border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-xl border bg-transparent px-3.5 text-[15px] outline-none focus-visible:ring-[3px]"
          />
          {emojiError && (
            <p className="text-status-negative text-xs">{t("emojiInvalid")}</p>
          )}
          <div className="grid grid-cols-8 gap-1.5">
            {SUGGESTED_EMOJIS.map((emoji) => {
              const selected = value === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setEmojiError(false);
                    setEmojiDraft("");
                    onChange(emoji);
                  }}
                  className={`flex aspect-square w-full max-w-10 items-center justify-center justify-self-center rounded-xl text-xl leading-none transition-colors ${
                    selected ? "ring-2 ring-inset" : "hover:bg-bg-muted"
                  }`}
                  style={
                    selected
                      ? ({
                          "--tw-ring-color": color,
                          backgroundColor: `${color}1F`,
                        } as CSSProperties)
                      : undefined
                  }
                  aria-label={t("selectEmoji", { emoji })}
                  aria-pressed={selected}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
