import { describe, expect, it } from "vitest";

import {
  SUGGESTED_EMOJIS,
  extractEmoji,
  isEmojiIcon,
  isValidCategoryIcon,
} from "@/lib/category-icon";

describe("isEmojiIcon", () => {
  it.each(["🍔", "☕", "✈️", "🏋️", "👩‍💻", "👍🏽", "🇦🇷", "1️⃣", "❤️"])(
    "accepts %s",
    (emoji) => {
      expect(isEmojiIcon(emoji)).toBe(true);
    },
  );

  it.each(["", "a", "abc", "🍔🍕", " 🍔", "🍔 ", "1", "UtensilsCrossed", null])(
    "rejects %s",
    (value) => {
      expect(isEmojiIcon(value)).toBe(false);
    },
  );

  it("treats every suggested emoji as valid", () => {
    for (const emoji of SUGGESTED_EMOJIS) expect(isEmojiIcon(emoji)).toBe(true);
  });
});

describe("isValidCategoryIcon", () => {
  it("accepts built-in icon names and single emojis", () => {
    expect(isValidCategoryIcon("UtensilsCrossed")).toBe(true);
    expect(isValidCategoryIcon("🍕")).toBe(true);
  });

  it("rejects unknown names and free text", () => {
    expect(isValidCategoryIcon("NotAnIcon")).toBe(false);
    expect(isValidCategoryIcon("<script>")).toBe(false);
  });
});

describe("extractEmoji", () => {
  it("returns the last emoji in the input", () => {
    expect(extractEmoji("🍔")).toBe("🍔");
    expect(extractEmoji("hola 🍕")).toBe("🍕");
    expect(extractEmoji("🍔🍕")).toBe("🍕");
    expect(extractEmoji("👨‍👩‍👧")).toBe("👨‍👩‍👧");
  });

  it("returns null when there is no emoji", () => {
    expect(extractEmoji("abc")).toBeNull();
    expect(extractEmoji("")).toBeNull();
  });
});
