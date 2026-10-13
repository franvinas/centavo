import { vi } from "vitest";

export function mockExchangeRateApi(
  rates: Record<string, number> = { EUR: 0.85, GBP: 0.73 },
) {
  const fetchMock = vi.fn().mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.includes("argentinadatos")
        ? [{ casa: "blue", fecha: "2025-01-01", venta: rates.ARS ?? 1000 }]
        : [
            {
              base: "USD",
              quote: "EUR",
              date: new URL(url).searchParams.get("date"),
              rate: rates.EUR ?? 0.85,
            },
          ],
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function mockExchangeRateApiError(
  status: number = 500,
  statusText: string = "Internal Server Error",
) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
