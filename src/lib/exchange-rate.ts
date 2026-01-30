interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

let cache: RateCache | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getUsdRates(): Promise<Record<string, number>> {
  const APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.rates;
  }

  const res = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
  }

  const data = (await res.json()) as { rates: Record<string, number> };

  cache = {
    rates: data.rates,
    timestamp: Date.now(),
  };

  return data.rates;
}

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  const rates = await getUsdRates();
  const fromRate = rates[from.toUpperCase()];
  const toRate = rates[to.toUpperCase()];

  if (!fromRate || !toRate) {
    throw new Error(`Exchange rate not found for ${from} -> ${to}`);
  }

  return toRate / fromRate;
}
