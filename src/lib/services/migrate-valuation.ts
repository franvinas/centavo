import { Prisma } from "@/generated/prisma/client";
import { buildValuation } from "./valuation";
import { readConversionRates } from "@/lib/expense-valuation";

export interface MigrationExpense {
  amount: string;
  currency: string;
  date: string;
  updatedAt: string;
  baseAmount: string | null;
  exchangeRate: string | null;
  legacyConversion: unknown;
  usdAmount: string | null;
  usdExchangeRate: string | null;
  conversionRates: unknown;
}

export async function planExpenseValuation(expense: MigrationExpense) {
  const saved = readConversionRates(expense.conversionRates);
  const legacy = expense.legacyConversion as {
    baseCurrency?: string;
    baseAmount?: string;
    exchangeRate?: string;
  } | null;
  // ARS must always use blue, even if an old USD conversion used official rates.
  const preserveLegacyUsd =
    expense.currency !== "ARS" &&
    expense.currency !== "USD" &&
    legacy?.baseCurrency === "USD" &&
    Number(legacy.exchangeRate) > 0 &&
    Number(legacy.baseAmount) > 0;
  const usdRate =
    expense.usdExchangeRate ??
    (preserveLegacyUsd ? legacy!.exchangeRate : null);
  const valuation = await buildValuation(
    expense.amount,
    expense.currency,
    expense.date,
    {
      ...expense,
      usdExchangeRate: usdRate,
      conversionRates: saved,
    },
  );
  if (expense.usdAmount != null)
    valuation.usdAmount = new Prisma.Decimal(expense.usdAmount);
  else if (preserveLegacyUsd && expense.currency !== "USD") {
    valuation.usdAmount = new Prisma.Decimal(legacy!.baseAmount!);
  }
  return valuation;
}
