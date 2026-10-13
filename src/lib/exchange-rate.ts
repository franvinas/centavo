import { z } from "zod/v4";
import type { ConversionRates, HistoricalQuote } from "./expense-valuation";

const TTL = 60 * 60 * 1000;
const REQUEST_TIMEOUT = 10_000;
const dateSchema = z.string().date();
const blueRowSchema = z.object({
  casa: z.literal("blue"),
  fecha: dateSchema,
  venta: z.number().positive().finite(),
});
const fxRowSchema = z.object({
  base: z.literal("USD"),
  quote: z.literal("EUR"),
  date: dateSchema,
  rate: z.number().positive().finite(),
});

let blueCache: { rows: z.infer<typeof blueRowSchema>[]; at: number } | null =
  null;
let blueRequest: Promise<z.infer<typeof blueRowSchema>[]> | null = null;
const eurCache = new Map<string, { quote: HistoricalQuote; at: number }>();
const eurRequests = new Map<string, Promise<HistoricalQuote | null>>();

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Historical rates unavailable (${response.status})`);
  return response.json();
}

async function loadBlueHistory() {
  if (blueCache && Date.now() - blueCache.at < TTL) return blueCache.rows;
  if (blueRequest) return blueRequest;
  blueRequest = (async () => {
    const payload = await fetchJson(
      "https://api.argentinadatos.com/v1/cotizaciones/dolares/blue",
    );
    if (!Array.isArray(payload))
      throw new Error("Invalid blue history response");
    // A malformed/zero quote must not hide other valid historical observations.
    const rows = payload
      .flatMap((row) => {
        const parsed = blueRowSchema.safeParse(row);
        return parsed.success ? [parsed.data] : [];
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    blueCache = { rows, at: Date.now() };
    return rows;
  })();
  try {
    return await blueRequest;
  } finally {
    blueRequest = null;
  }
}

export async function getHistoricalBlueSale(
  date: string,
): Promise<HistoricalQuote | null> {
  dateSchema.parse(date);
  // Future expenses cannot acquire a historical quote yet.
  if (date > new Date().toISOString().slice(0, 10)) return null;
  const row = (await loadBlueHistory()).find((row) => row.fecha <= date);
  return row
    ? { rate: row.venta, date: row.fecha, source: "argentinadatos:blue:venta" }
    : null;
}

async function getHistoricalEur(date: string): Promise<HistoricalQuote | null> {
  const cached = eurCache.get(date);
  if (cached && Date.now() - cached.at < TTL) return cached.quote;
  const inFlight = eurRequests.get(date);
  if (inFlight) return inFlight;
  const request = (async () => {
    const payload = await fetchJson(
      `https://api.frankfurter.dev/v2/rates?date=${date}&base=USD&quotes=EUR`,
    );
    if (!Array.isArray(payload))
      throw new Error("Invalid historical EUR response");
    const rows = payload
      .flatMap((row) => {
        const parsed = fxRowSchema.safeParse(row);
        return parsed.success && parsed.data.date <= date ? [parsed.data] : [];
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    const row = rows[0];
    if (!row) return null;
    const quote = {
      rate: row.rate,
      date: row.date,
      source: "frankfurter:USD/EUR",
    };
    if (eurCache.size >= 512) eurCache.delete(eurCache.keys().next().value!);
    eurCache.set(date, { quote, at: Date.now() });
    return quote;
  })();
  eurRequests.set(date, request);
  try {
    return await request;
  } finally {
    eurRequests.delete(date);
  }
}

export async function getHistoricalRates(
  date: string,
): Promise<ConversionRates> {
  dateSchema.parse(date);
  const rates: ConversionRates = { USD: { rate: 1, date, source: "identity" } };
  if (date > new Date().toISOString().slice(0, 10)) return rates;
  const [blue, eur] = await Promise.allSettled([
    getHistoricalBlueSale(date),
    getHistoricalEur(date),
  ]);
  if (blue.status === "fulfilled" && blue.value) rates.ARS = blue.value;
  if (eur.status === "fulfilled" && eur.value) rates.EUR = eur.value;
  return rates;
}

export async function getExchangeRate(
  from: string,
  to: string,
  date = new Date().toISOString().slice(0, 10),
): Promise<number> {
  from = from.toUpperCase();
  to = to.toUpperCase();
  if (from === to) return 1;
  const rates = await getHistoricalRates(date);
  if (!rates[from] || !rates[to])
    throw new Error(
      `Historical exchange rate not found for ${from} -> ${to} on ${date}`,
    );
  return rates[to].rate / rates[from].rate;
}
