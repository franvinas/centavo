import {
  buildSystemPrompt,
  getCurrentDateInTimeZone,
} from "@/lib/telegram/llm";
import { describe, expect, it, vi } from "vitest";

describe("telegram llm date handling", () => {
  it("computes today's date in user timezone near UTC day boundary", () => {
    const now = new Date("2026-02-06T00:30:00.000Z");

    const date = getCurrentDateInTimeZone(
      "America/Argentina/Buenos_Aires",
      now,
    );

    expect(date).toBe("2026-02-05");
  });

  it("falls back to UTC when timezone is invalid", () => {
    const now = new Date("2026-02-06T00:30:00.000Z");

    const date = getCurrentDateInTimeZone("Not/A_Real_Timezone", now);

    expect(date).toBe("2026-02-06");
  });

  it("includes local Today date in system prompt", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-02-06T00:30:00.000Z"));

      const prompt = buildSystemPrompt({
        userId: "user-1",
        userName: "Fran",
        baseCurrency: "ARS",
        locale: "es",
        timezone: "America/Argentina/Buenos_Aires",
        categories: [{ id: "cat-1", name: "Food", icon: "utensils" }],
      });

      expect(prompt).toContain("Today: 2026-02-05");
    } finally {
      vi.useRealTimers();
    }
  });
});
