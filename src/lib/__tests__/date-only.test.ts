import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseDateOnly,
  positiveInteger,
  todayInTimezone,
} from "@/lib/date-only";
import { getDateRange } from "@/lib/analytics-periods";
afterEach(() => vi.useRealTimers());
describe("safe queries and calendar dates", () => {
  it.each([
    "foo",
    "1.5",
    "-1",
    "0",
    "1abc",
    "Infinity",
    "9007199254740992",
    null,
    NaN,
  ])("defaults invalid pagination %s", (value) =>
    expect(positiveInteger(value, 1, 100)).toBe(1),
  );
  it("clamps large valid limits", () =>
    expect(positiveInteger("9999", 50, 100)).toBe(100));
  it.each(["2026-02-30", "garbage", "2026-13-01"])(
    "rejects invalid date %s",
    (value) => expect(parseDateOnly(value)).toBeNull(),
  );
  it("chooses the user's calendar day at a UTC month boundary", () => {
    const now = new Date("2026-03-01T01:00:00Z");
    expect(
      todayInTimezone("America/Argentina/Buenos_Aires", now).toISOString(),
    ).toBe("2026-02-28T00:00:00.000Z");
    expect(todayInTimezone("Asia/Tokyo", now).toISOString()).toBe(
      "2026-03-01T00:00:00.000Z",
    );
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const range = getDateRange(
      "this-month",
      undefined,
      undefined,
      "America/Argentina/Buenos_Aires",
      "es",
    );
    expect(range.from.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(range.label).toContain("febrero");
  });
  it("falls back safely for an invalid timezone or reversed range", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-02T01:00:00Z"));
    expect(todayInTimezone("invalid").toISOString()).toBe(
      "2026-03-02T00:00:00.000Z",
    );
    expect(
      getDateRange("custom", "2026-03-31", "2026-03-01").from.toISOString(),
    ).toBe("2026-03-01T00:00:00.000Z");
  });
});
