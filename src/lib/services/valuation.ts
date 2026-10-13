import { Prisma } from "@/generated/prisma/client";
import { getHistoricalRates } from "@/lib/exchange-rate";
import { readConversionRates } from "@/lib/expense-valuation";

// Preserves successful snapshots on retry; only missing quotes are fetched.
export async function buildValuation(
  amount: number | string,
  currency: string,
  date: string,
  previous?: {
    conversionRates?: unknown;
    usdAmount?: unknown;
    usdExchangeRate?: unknown;
  },
) {
  const saved = readConversionRates(previous?.conversionRates);
  const rates =
    Object.keys(saved).length === 3
      ? saved
      : { ...(await getHistoricalRates(date)), ...saved };
  const originalQuote = rates[currency];
  const usdExchangeRate =
    previous?.usdExchangeRate != null
      ? new Prisma.Decimal(String(previous.usdExchangeRate))
      : originalQuote
        ? new Prisma.Decimal(1).div(originalQuote.rate).toDecimalPlaces(16)
        : null;
  const usdAmount = usdExchangeRate
    ? new Prisma.Decimal(amount).mul(usdExchangeRate).toDecimalPlaces(10)
    : null;
  return {
    usdAmount,
    usdExchangeRate: usdExchangeRate?.toDecimalPlaces(16) ?? null,
    conversionRates: rates as Prisma.InputJsonObject,
  };
}
