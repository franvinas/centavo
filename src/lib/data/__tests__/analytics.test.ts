import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import {
  getAnalyticsSummary,
  getSpendingByCategory,
  getSpendingOverTime,
  getSpendingByCurrency,
} from "@/lib/data/analytics";

// groupBy has complex overloaded types that don't work with mockDeep
const mockExpenseGroupBy = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prismaMock.expense as any).groupBy = mockExpenseGroupBy;

const params = {
  userId: "user-1",
  from: new Date(2025, 0, 1), // Jan 1 2025 local
  to: new Date(2025, 2, 31), // Mar 31 2025 local
};

describe("getAnalyticsSummary", () => {
  beforeEach(() => resetPrismaMock());

  it("returns totals from aggregate", async () => {
    prismaMock.expense.aggregate.mockResolvedValue({
      _sum: { baseAmount: 500 as never },
      _count: 10,
      _avg: { baseAmount: null },
      _min: { baseAmount: null },
      _max: { baseAmount: null },
    } as never);

    const result = await getAnalyticsSummary(params);

    expect(result.totalSpent).toBe(500);
    expect(result.transactionCount).toBe(10);
    // 90 days from Jan 1 to Mar 31
    expect(result.dailyAverage).toBeCloseTo(500 / 90, 1);
  });

  it("returns zeros when no expenses", async () => {
    prismaMock.expense.aggregate.mockResolvedValue({
      _sum: { baseAmount: null },
      _count: 0,
      _avg: { baseAmount: null },
      _min: { baseAmount: null },
      _max: { baseAmount: null },
    } as never);

    const result = await getAnalyticsSummary(params);

    expect(result.totalSpent).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.dailyAverage).toBe(0);
  });
});

describe("getSpendingByCategory", () => {
  beforeEach(() => resetPrismaMock());

  it("groups expenses by category with metadata", async () => {
    mockExpenseGroupBy.mockResolvedValue([
      { categoryId: "cat-1", _sum: { baseAmount: 300 }, _count: 5 },
      { categoryId: "cat-2", _sum: { baseAmount: 200 }, _count: 3 },
    ] as never);

    prismaMock.category.findMany.mockResolvedValue([
      {
        id: "cat-1",
        name: "Food",
        color: "#E8855B",
        icon: "UtensilsCrossed",
        userId: "user-1",
        createdAt: new Date(),
      },
      {
        id: "cat-2",
        name: "Transport",
        color: "#4A90D9",
        icon: "Car",
        userId: "user-1",
        createdAt: new Date(),
      },
    ] as never);

    const result = await getSpendingByCategory(params);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Food");
    expect(result[0].total).toBe(300);
    expect(result[0].count).toBe(5);
    expect(result[0].color).toBe("#E8855B");
    expect(result[1].name).toBe("Transport");
    expect(result[1].total).toBe(200);
  });

  it("returns empty array when no expenses", async () => {
    mockExpenseGroupBy.mockResolvedValue([] as never);

    const result = await getSpendingByCategory(params);

    expect(result).toEqual([]);
  });

  it("sorts by total descending", async () => {
    mockExpenseGroupBy.mockResolvedValue([
      { categoryId: "cat-1", _sum: { baseAmount: 100 }, _count: 2 },
      { categoryId: "cat-2", _sum: { baseAmount: 500 }, _count: 8 },
    ] as never);

    prismaMock.category.findMany.mockResolvedValue([
      {
        id: "cat-1",
        name: "Food",
        color: "#E8855B",
        icon: "UtensilsCrossed",
        userId: "user-1",
        createdAt: new Date(),
      },
      {
        id: "cat-2",
        name: "Transport",
        color: "#4A90D9",
        icon: "Car",
        userId: "user-1",
        createdAt: new Date(),
      },
    ] as never);

    const result = await getSpendingByCategory(params);

    expect(result[0].total).toBe(500);
    expect(result[1].total).toBe(100);
  });
});

describe("getSpendingOverTime", () => {
  beforeEach(() => resetPrismaMock());

  it("groups by month and fills gaps", async () => {
    prismaMock.expense.findMany.mockResolvedValue([
      { date: new Date(2025, 0, 15), baseAmount: 100 },
      { date: new Date(2025, 0, 20), baseAmount: 50 },
      { date: new Date(2025, 2, 10), baseAmount: 200 },
    ] as never);

    const result = await getSpendingOverTime(params);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ period: "2025-01", total: 150 });
    expect(result[1]).toEqual({ period: "2025-02", total: 0 }); // gap filled
    expect(result[2]).toEqual({ period: "2025-03", total: 200 });
  });

  it("returns filled zero-months when no expenses", async () => {
    prismaMock.expense.findMany.mockResolvedValue([] as never);

    const result = await getSpendingOverTime(params);

    expect(result).toHaveLength(3);
    expect(result.every((p) => p.total === 0)).toBe(true);
  });
});

describe("getSpendingByCurrency", () => {
  beforeEach(() => resetPrismaMock());

  it("groups by currency with both amount types", async () => {
    mockExpenseGroupBy.mockResolvedValue([
      { currency: "USD", _sum: { amount: 400, baseAmount: 400 }, _count: 5 },
      { currency: "EUR", _sum: { amount: 200, baseAmount: 220 }, _count: 3 },
    ] as never);

    const result = await getSpendingByCurrency(params);

    expect(result).toHaveLength(2);
    expect(result[0].currency).toBe("USD");
    expect(result[0].originalTotal).toBe(400);
    expect(result[0].baseTotal).toBe(400);
    expect(result[0].count).toBe(5);
    expect(result[1].currency).toBe("EUR");
    expect(result[1].originalTotal).toBe(200);
    expect(result[1].baseTotal).toBe(220);
  });

  it("sorts by baseTotal descending", async () => {
    mockExpenseGroupBy.mockResolvedValue([
      { currency: "EUR", _sum: { amount: 200, baseAmount: 220 }, _count: 3 },
      { currency: "USD", _sum: { amount: 400, baseAmount: 400 }, _count: 5 },
    ] as never);

    const result = await getSpendingByCurrency(params);

    expect(result[0].currency).toBe("USD");
    expect(result[1].currency).toBe("EUR");
  });
});
