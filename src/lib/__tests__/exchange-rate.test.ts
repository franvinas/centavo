import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("getExchangeRate", () => {
  let getExchangeRate: typeof import("../exchange-rate").getExchangeRate;

  beforeEach(async () => {
    vi.stubEnv("OPEN_EXCHANGE_RATES_APP_ID", "test-app-id");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: { USD: 1, EUR: 0.85, GBP: 0.73, ARS: 1447.85 },
        }),
      }),
    );
    vi.resetModules();
    ({ getExchangeRate } = await import("../exchange-rate"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns 1 for same currency", async () => {
    const rate = await getExchangeRate("USD", "USD");
    expect(rate).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches exchange rate from API", async () => {
    const rate = await getExchangeRate("USD", "EUR");
    expect(rate).toBe(0.85);
    expect(fetch).toHaveBeenCalledWith(
      "https://openexchangerates.org/api/latest.json?app_id=test-app-id",
    );
  });

  it("computes cross-rate between non-USD currencies", async () => {
    const rate = await getExchangeRate("EUR", "ARS");
    expect(rate).toBeCloseTo(1447.85 / 0.85);
  });

  it("handles case-insensitive currency codes", async () => {
    const rate = await getExchangeRate("usd", "eur");
    expect(rate).toBe(0.85);
  });

  it("throws on API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Service Unavailable",
      }),
    );

    await expect(getExchangeRate("USD", "XYZ")).rejects.toThrow(
      "Failed to fetch exchange rates",
    );
  });

  it("throws when rate not found in response", async () => {
    await expect(getExchangeRate("USD", "INVALID")).rejects.toThrow(
      "Exchange rate not found",
    );
  });

  it("uses cached rates on subsequent calls", async () => {
    await getExchangeRate("USD", "EUR");
    await getExchangeRate("USD", "GBP");

    const rate = await getExchangeRate("USD", "GBP");
    expect(rate).toBe(0.73);
    // All calls share one cached response
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
