import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatRelativeDate,
  formatDateGroup,
} from "../format";

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(25.5)).toBe("$25.50");
  });

  it("formats with explicit currency", () => {
    expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
  });

  it("formats EUR", () => {
    const result = formatCurrency(100, "EUR");
    expect(result).toContain("100.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(10.999)).toBe("$11.00");
  });
});

describe("formatNumber", () => {
  it("formats integers with thousands separators", () => {
    expect(formatNumber(1234)).toBe("1,234");
  });

  it("formats large numbers", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formats small numbers without separators", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formats decimals", () => {
    expect(formatNumber(1234.56)).toBe("1,234.56");
  });
});

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Today' for today's date", () => {
    expect(formatRelativeDate("2025-01-15")).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday", () => {
    expect(formatRelativeDate("2025-01-14")).toBe("Yesterday");
  });

  it("returns 'X days ago' for less than a week", () => {
    expect(formatRelativeDate("2025-01-12")).toBe("3 days ago");
  });

  it("returns formatted date for older dates", () => {
    const result = formatRelativeDate("2025-01-01T12:00:00");
    expect(result).toContain("Jan");
    expect(result).toContain("1");
  });

  it("includes year for different year", () => {
    const result = formatRelativeDate("2024-06-15");
    expect(result).toContain("2024");
  });
});

describe("formatDateGroup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Today' for today's date", () => {
    expect(formatDateGroup("2025-01-15T12:00:00")).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday", () => {
    expect(formatDateGroup("2025-01-14T12:00:00")).toBe("Yesterday");
  });

  it("returns weekday + month + day for older dates", () => {
    const result = formatDateGroup("2025-01-10T12:00:00");
    expect(result).toContain("Jan");
    expect(result).toContain("10");
  });
});
