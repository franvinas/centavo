import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDateRange, PERIOD_PRESETS } from "@/lib/analytics-periods";

describe("PERIOD_PRESETS", () => {
  it("has 6 presets", () => {
    expect(PERIOD_PRESETS).toHaveLength(6);
  });

  it("includes expected keys", () => {
    const keys = PERIOD_PRESETS.map((p) => p.key);
    expect(keys).toEqual([
      "this-month",
      "last-3-months",
      "last-6-months",
      "last-12-months",
      "this-year",
      "custom",
    ]);
  });
});

describe("getDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns this month range", () => {
    const range = getDateRange("this-month");
    expect(range.from).toEqual(new Date(2025, 5, 1));
    expect(range.to).toEqual(new Date(2025, 5, 15));
    expect(range.label).toBe("June 2025");
  });

  it("returns last 3 months range", () => {
    const range = getDateRange("last-3-months");
    expect(range.from).toEqual(new Date(2025, 3, 1)); // April 1
    expect(range.to).toEqual(new Date(2025, 5, 15));
    expect(range.label).toBe("Last 3 Months");
  });

  it("returns last 6 months range", () => {
    const range = getDateRange("last-6-months");
    expect(range.from).toEqual(new Date(2025, 0, 1)); // January 1
    expect(range.to).toEqual(new Date(2025, 5, 15));
    expect(range.label).toBe("Last 6 Months");
  });

  it("returns last 12 months range", () => {
    const range = getDateRange("last-12-months");
    expect(range.from).toEqual(new Date(2024, 6, 1)); // July 1, 2024
    expect(range.to).toEqual(new Date(2025, 5, 15));
    expect(range.label).toBe("Last 12 Months");
  });

  it("returns this year range", () => {
    const range = getDateRange("this-year");
    expect(range.from).toEqual(new Date(2025, 0, 1));
    expect(range.to).toEqual(new Date(2025, 5, 15));
    expect(range.label).toBe("2025");
  });

  it("returns custom range with valid dates", () => {
    const range = getDateRange("custom", "2025-03-01", "2025-04-30");
    expect(range.from).toEqual(new Date("2025-03-01T00:00:00"));
    expect(range.to).toEqual(new Date("2025-04-30T00:00:00"));
    expect(range.label).toContain("Mar");
    expect(range.label).toContain("Apr");
  });

  it("falls back to this month for custom without dates", () => {
    const range = getDateRange("custom");
    expect(range.from).toEqual(new Date(2025, 5, 1));
    expect(range.to).toEqual(new Date(2025, 5, 15));
  });

  it("falls back to this month for unknown preset", () => {
    const range = getDateRange("unknown");
    expect(range.from).toEqual(new Date(2025, 5, 1));
    expect(range.to).toEqual(new Date(2025, 5, 15));
  });
});
