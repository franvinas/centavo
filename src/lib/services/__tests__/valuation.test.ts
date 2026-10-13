import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildValuation } from "../valuation";
import {
  planExpenseValuation,
  type MigrationExpense,
} from "../migrate-valuation";
import { getHistoricalRates } from "@/lib/exchange-rate";
import { getDisplayAmount } from "@/lib/expense-valuation";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import { createExpenseForUser, updateExpenseForUser } from "../expenses";

vi.mock("@/lib/exchange-rate", () => ({ getHistoricalRates: vi.fn() }));
const quotes = {
  USD: { rate: 1, date: "2024-01-07", source: "identity" },
  ARS: { rate: 1000, date: "2024-01-05", source: "argentinadatos:blue:venta" },
  EUR: { rate: 0.9, date: "2024-01-05", source: "frankfurter:USD/EUR" },
};
const old: MigrationExpense = {
  amount: "10000.01",
  currency: "ARS",
  date: "2024-01-07",
  updatedAt: "2024-01-07T12:00:00Z",
  baseAmount: "25",
  exchangeRate: "0.0025",
  legacyConversion: {
    baseCurrency: "USD",
    baseAmount: "25",
    exchangeRate: "0.0025",
  },
  usdAmount: null,
  usdExchangeRate: null,
  conversionRates: null,
};
beforeEach(() => {
  resetPrismaMock();
  vi.clearAllMocks();
  vi.mocked(getHistoricalRates).mockResolvedValue(quotes);
});

describe("expense snapshots and migration", () => {
  it("uses historical blue sale and persists source/effective date", async () => {
    const valuation = await buildValuation(10000.01, "ARS", "2024-01-07");
    expect(valuation.usdAmount?.toString()).toBe("10.00001");
    expect(Number(valuation.usdExchangeRate)).toBe(0.001);
    expect(valuation.conversionRates.ARS).toEqual(quotes.ARS);
    expect(getHistoricalRates).toHaveBeenCalledWith("2024-01-07");
  });
  it("migrates ARS using blue rather than preserving an official USD conversion", async () => {
    const before = JSON.stringify(old);
    const valuation = await planExpenseValuation(old);
    expect(valuation.usdAmount?.toString()).toBe("10.00001");
    expect(JSON.stringify(old)).toBe(before);
    expect(getDisplayAmount({ ...old, ...valuation }, "ARS")).toBe(10000.01);
  });
  it("preserves an existing non-ARS USD conversion and legacy data", async () => {
    const valuation = await planExpenseValuation({
      ...old,
      amount: "20",
      currency: "EUR",
      legacyConversion: {
        baseCurrency: "USD",
        baseAmount: "22.22",
        exchangeRate: "1.111111",
      },
    });
    expect(valuation.usdAmount?.toString()).toBe("22.22");
    expect(valuation.usdExchangeRate?.toString()).toBe("1.111111");
  });
  it("is resumable without refreshing saved historical rates", async () => {
    const first = await planExpenseValuation(old);
    vi.mocked(getHistoricalRates).mockClear();
    const second = await planExpenseValuation({
      ...old,
      usdAmount: first.usdAmount!.toString(),
      usdExchangeRate: first.usdExchangeRate!.toString(),
      conversionRates: first.conversionRates,
    });
    expect(second).toEqual(first);
    expect(getHistoricalRates).not.toHaveBeenCalled();
  });
  it("leaves unavailable historical ARS pending while preserving originals", async () => {
    vi.mocked(getHistoricalRates).mockResolvedValue({ USD: quotes.USD });
    const valuation = await planExpenseValuation(old);
    expect(valuation.usdAmount).toBeNull();
    expect(getDisplayAmount({ ...old, ...valuation }, "ARS")).toBe(10000.01);
    expect(getDisplayAmount({ ...old, ...valuation }, "USD")).toBeNull();
  });
  it("retries missing quotes without overwriting successful snapshots", async () => {
    const savedBlue = { ...quotes.ARS, rate: 950 };
    const valuation = await planExpenseValuation({
      ...old,
      usdAmount: "10.5263263158",
      usdExchangeRate: "0.001052631579",
      conversionRates: { USD: quotes.USD, ARS: savedBlue },
    });
    expect(valuation.conversionRates.ARS).toEqual(savedBlue);
    expect(valuation.conversionRates.EUR).toEqual(quotes.EUR);
    expect(valuation.usdAmount?.toString()).toBe("10.5263263158");
  });
  it("creates a pending expense even if the historical provider has no quote", async () => {
    vi.mocked(getHistoricalRates).mockResolvedValue({ USD: quotes.USD });
    prismaMock.category.findFirst.mockResolvedValue({ id: "cat-1" } as never);
    prismaMock.user.findUnique.mockResolvedValue({
      baseCurrency: "USD",
    } as never);
    prismaMock.expense.create.mockResolvedValue(
      createPrismaExpense({
        amount: 10000.01,
        currency: "ARS",
        usdAmount: null,
        usdExchangeRate: null,
        conversionRates: { USD: quotes.USD },
      }) as never,
    );
    const expense = await createExpenseForUser("user-1", {
      amount: 10000.01,
      currency: "ARS",
      description: "Lunch",
      date: "2024-01-07",
      categoryId: "cat-1",
    });
    expect(expense.amount).toBe(10000.01);
    expect(expense.baseAmount).toBeNull();
    expect(expense.conversionPending).toBe(true);
  });
  it("refreshes the quote when the expense date changes", async () => {
    prismaMock.expense.findFirst.mockResolvedValue(
      createPrismaExpense({
        amount: 10000,
        currency: "ARS",
        date: new Date("2024-01-05"),
        conversionRates: quotes,
      }) as never,
    );
    prismaMock.expense.update.mockResolvedValue(createPrismaExpense() as never);
    await updateExpenseForUser("user-1", "exp-1", { date: "2024-01-07" });
    expect(getHistoricalRates).toHaveBeenCalledWith("2024-01-07");
    expect(
      Number(prismaMock.expense.update.mock.calls[0][0].data.usdAmount),
    ).toBe(10);
  });
  it("does not refresh rates when editing only description", async () => {
    prismaMock.expense.findFirst.mockResolvedValue(
      createPrismaExpense() as never,
    );
    prismaMock.expense.update.mockResolvedValue(createPrismaExpense() as never);
    await updateExpenseForUser("user-1", "exp-1", {
      description: "New description",
    });
    expect(getHistoricalRates).not.toHaveBeenCalled();
    expect(prismaMock.expense.update.mock.calls[0][0].data).toEqual({
      description: "New description",
    });
  });
});
