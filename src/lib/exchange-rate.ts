interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

const cache = new Map<string, RateCache>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  const cacheKey = from.toUpperCase();
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const rate = cached.rates[to.toUpperCase()];
    if (rate) return rate;
  }

  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${from.toUpperCase()}&to=${to.toUpperCase()}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rate: ${res.statusText}`);
  }

  const data = (await res.json()) as { rates: Record<string, number> };

  cache.set(cacheKey, {
    rates: data.rates,
    timestamp: Date.now(),
  });

  const rate = data.rates[to.toUpperCase()];
  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} -> ${to}`);
  }

  return rate;
}
