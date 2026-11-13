import { availableIcons } from "@/lib/category-icon-map";

const EMOJI_PATTERN = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;
const MAX_EMOJI_LENGTH = 32;

function graphemes(value: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(value), (s) => s.segment);
}

/** True when `value` is exactly one emoji (including ZWJ sequences, flags, keycaps and skin tones). */
export function isEmojiIcon(value: string | null | undefined): boolean {
  if (!value || value.length > MAX_EMOJI_LENGTH) return false;
  if (value !== value.trim()) return false;
  const parts = graphemes(value);
  return parts.length === 1 && EMOJI_PATTERN.test(parts[0]);
}

export function isLucideIcon(value: string | null | undefined): boolean {
  return !!value && availableIcons.includes(value);
}

/** A category icon is either a built-in icon name or a single emoji. */
export function isValidCategoryIcon(value: string): boolean {
  return isLucideIcon(value) || isEmojiIcon(value);
}

/** Returns the last emoji typed or pasted into `input`, or null if there is none. */
export function extractEmoji(input: string): string | null {
  const parts = graphemes(input.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    if (isEmojiIcon(parts[i])) return parts[i];
  }
  return null;
}

export const SUGGESTED_EMOJIS = [
  "🍔",
  "🍕",
  "☕",
  "🍺",
  "🛒",
  "🚗",
  "⛽",
  "🚌",
  "✈️",
  "🏠",
  "💡",
  "📱",
  "💻",
  "🎮",
  "🎬",
  "🎵",
  "📚",
  "🎓",
  "💊",
  "🏥",
  "🏋️",
  "👕",
  "💄",
  "🎁",
  "🐶",
  "👶",
  "💼",
  "💰",
  "💳",
  "🧾",
  "🔧",
  "🌱",
];
