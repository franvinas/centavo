import { beforeEach, describe, expect, it } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import {
  getAnalyticsSummary,
  getSpendingByCategory,
  getSpendingOverTime,
  getSpendingByCurrency,
} from "../analytics";

const rates = {
  USD: { rate: 1, date: "2025-01-15", source: "identity" },
  ARS: { rate: 1000, date: "2025-01-15", source: "argentinadatos:blue:venta" },
};
const params = {
  userId: "user-1",
  from: new Date("2025-01-01"),
  to: new Date("2025-03-31"),
  baseCurrency: "ARS",
};
const expenses = [
  createPrismaExpense({
    amount: 10000,
    currency: "ARS",
    baseAmount: 999,
    usdAmount: 10,
    conversionRates: rates,
  }),
  createPrismaExpense({
    amount: 2,
    currency: "USD",
    usdAmount: 2,
    conversionRates: rates,
  }),
  createPrismaExpense({
    amount: 100,
    currency: "EUR",
    usdAmount: null,
    conversionRates: null,
    date: new Date("2025-03-10"),
  }),
];
beforeEach(() => {
  resetPrismaMock();
  prismaMock.expense.findMany.mockResolvedValue(expenses as never);
});

describe("historical totals", () => {
  it("adds original ARS directly and flags incomplete conversions", async () => {
    expect(await getAnalyticsSummary(params)).toEqual({
      totalSpent: 12000,
      transactionCount: 3,
      dailyAverage: 12000 / 90,
      pendingConversionCount: 1,
    });
    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", date: { gte: params.from, lte: params.to } },
      }),
    );
  });
  it("changes display currency without updating expenses or requesting new rates", async () => {
    expect(
      (await getAnalyticsSummary({ ...params, baseCurrency: "USD" }))
        .totalSpent,
    ).toBe(12);
    expect(prismaMock.expense.update).not.toHaveBeenCalled();
  });
  it("counts pending rows in category totals", async () => {
    expect(await getSpendingByCategory(params)).toEqual([
      expect.objectContaining({
        categoryId: "cat-1",
        total: 12000,
        count: 3,
        pendingConversionCount: 1,
      }),
    ]);
  });
  it("uses UTC calendar months and fills empty months", async () => {
    expect(await getSpendingOverTime(params)).toEqual([
      { period: "2025-01", total: 12000, pendingConversionCount: 0 },
      { period: "2025-02", total: 0, pendingConversionCount: 0 },
      { period: "2025-03", total: 0, pendingConversionCount: 1 },
    ]);
  });
  it("preserves original currency totals for pending rows", async () => {
    const groups = await getSpendingByCurrency(params);
    expect(groups.find((g) => g.currency === "ARS")).toMatchObject({
      originalTotal: 10000,
      baseTotal: 10000,
    });
    expect(groups.find((g) => g.currency === "EUR")).toMatchObject({
      originalTotal: 100,
      baseTotal: 0,
      pendingConversionCount: 1,
    });
  });
  it("returns empty totals when no expenses", async () => {
    prismaMock.expense.findMany.mockResolvedValue([]);
    expect(await getAnalyticsSummary(params)).toMatchObject({
      totalSpent: 0,
      transactionCount: 0,
      pendingConversionCount: 0,
    });
    expect(await getSpendingByCategory(params)).toEqual([]);
    expect(
      (await getSpendingOverTime(params)).every((p) => p.total === 0),
    ).toBe(true);
  });
});
