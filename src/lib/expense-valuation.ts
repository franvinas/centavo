import { z } from "zod/v4";

export const quoteSchema = z.object({
  rate: z.number().positive().finite(),
  date: z.string().date(),
  source: z.string().min(1),
});
export const conversionRatesSchema = z.record(z.string(), quoteSchema);
export type HistoricalQuote = z.infer<typeof quoteSchema>;
export type ConversionRates = z.infer<typeof conversionRatesSchema>;

export interface ValuedExpense {
  amount: unknown;
  currency: string;
  usdAmount?: unknown;
  usdExchangeRate?: unknown;
  conversionRates?: unknown;
}

export function readConversionRates(value: unknown): ConversionRates {
  const parsed = conversionRatesSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

export function getDisplayAmount(
  expense: ValuedExpense,
  currency: string,
): number | null {
  // Never round-trip an original amount through USD.
  if (expense.currency === currency) return Number(expense.amount);
  if (expense.usdAmount == null) return null;
  const quote = readConversionRates(expense.conversionRates)[currency];
  if (!quote) return null;
  return Number((Number(expense.usdAmount) * quote.rate).toFixed(2));
}

export function presentExpense<T extends ValuedExpense>(
  expense: T,
  baseCurrency: string,
): Omit<T, "baseAmount" | "exchangeRate"> & {
  baseAmount: number | null;
  exchangeRate: number | null;
  baseCurrency: string;
  conversionPending: boolean;
} {
  const baseAmount = getDisplayAmount(expense, baseCurrency);
  const target = readConversionRates(expense.conversionRates)[baseCurrency];
  return {
    ...expense,
    baseCurrency,
    baseAmount,
    exchangeRate:
      expense.currency === baseCurrency
        ? 1
        : expense.usdExchangeRate == null || !target
          ? null
          : Number(expense.usdExchangeRate) * target.rate,
    conversionPending: baseAmount === null,
  };
}

export function sumDisplayAmounts(expenses: ValuedExpense[], currency: string) {
  let cents = 0;
  let pendingConversionCount = 0;
  for (const expense of expenses) {
    const amount = getDisplayAmount(expense, currency);
    if (amount === null) pendingConversionCount++;
    else cents += Math.round(amount * 100);
  }
  return { total: cents / 100, pendingConversionCount };
}
