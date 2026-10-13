import { describe, expect, it } from "vitest";
import { getDisplayAmount, sumDisplayAmounts } from "../expense-valuation";

const conversionRates = {
  USD: { rate: 1, date: "2024-01-05", source: "identity" },
  ARS: { rate: 1000, date: "2024-01-05", source: "argentinadatos:blue:venta" },
  EUR: { rate: 0.9, date: "2024-01-05", source: "frankfurter:USD/EUR" },
};
const expense = {
  amount: "10000.01",
  currency: "ARS",
  usdAmount: "10.00001",
  conversionRates,
};

describe("display valuation", () => {
  it("returns original ARS cents exactly even without a USD conversion", () => {
    expect(getDisplayAmount({ ...expense, usdAmount: null }, "ARS")).toBe(
      10000.01,
    );
  });
  it("uses the persisted historical snapshot for USD and EUR", () => {
    expect(getDisplayAmount(expense, "USD")).toBe(10);
    expect(getDisplayAmount(expense, "EUR")).toBe(9);
    expect(getDisplayAmount(expense, "ARS")).toBe(10000.01);
  });
  it("returns null for missing conversions instead of claiming zero spending", () => {
    expect(getDisplayAmount({ ...expense, usdAmount: null }, "USD")).toBeNull();
    expect(
      getDisplayAmount({ ...expense, conversionRates: null }, "EUR"),
    ).toBeNull();
  });
  it("does not sum unlabelled legacy conversions", () => {
    expect(
      getDisplayAmount(
        { amount: 10000, currency: "ARS", baseAmount: 100 } as never,
        "USD",
      ),
    ).toBeNull();
  });
  it("adds cents exactly and counts pending conversions", () => {
    expect(
      sumDisplayAmounts(
        [
          { amount: 0.1, currency: "ARS" },
          { amount: 0.2, currency: "ARS" },
          { amount: 10, currency: "EUR" },
        ],
        "ARS",
      ),
    ).toEqual({ total: 0.3, pendingConversionCount: 1 });
  });
});
