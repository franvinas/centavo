import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let rates: typeof import("../exchange-rate");
const blue = [
  { casa: "blue", fecha: "2024-01-08", venta: 1200, compra: 1150 },
  { casa: "blue", fecha: "2024-01-05", venta: 1000, compra: 950 },
  { casa: "blue", fecha: "2024-01-04", venta: 900, compra: 850 },
];

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes("argentinadatos")
          ? blue
          : [
              {
                date: new URL(url).searchParams.get("date"),
                base: "USD",
                quote: "EUR",
                rate: 0.9,
              },
            ],
    })),
  );
  rates = await import("../exchange-rate");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("historical exchange rates", () => {
  it("uses sale, never purchase, for the expense date", async () => {
    expect(await rates.getExchangeRate("ARS", "USD", "2024-01-05")).toBe(0.001);
    expect(await rates.getHistoricalBlueSale("2024-01-05")).toEqual({
      rate: 1000,
      date: "2024-01-05",
      source: "argentinadatos:blue:venta",
    });
  });
  it("chooses the last previous quote on a missing day, never a future quote", async () => {
    expect(await rates.getHistoricalBlueSale("2024-01-07")).toMatchObject({
      rate: 1000,
      date: "2024-01-05",
    });
  });
  it("leaves dates before history pending without substituting a current rate", async () => {
    expect(await rates.getHistoricalBlueSale("2010-01-01")).toBeNull();
    await expect(
      rates.getExchangeRate("ARS", "USD", "2010-01-01"),
    ).rejects.toThrow("Historical exchange rate not found");
  });
  it("uses blue for cross rates involving EUR", async () => {
    expect(await rates.getExchangeRate("EUR", "ARS", "2024-01-05")).toBeCloseTo(
      1000 / 0.9,
    );
  });
  it("normalizes currency codes and avoids requests for identity", async () => {
    expect(await rates.getExchangeRate("ars", "ARS", "2024-01-05")).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("isolates provider failures and leaves ARS pending", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (String(url).includes("argentinadatos")) throw new Error("Offline");
      return {
        ok: true,
        json: async () => [
          { date: "2024-01-05", base: "USD", quote: "EUR", rate: 0.9 },
        ],
      } as Response;
    });
    expect(await rates.getHistoricalRates("2024-01-05")).toMatchObject({
      USD: { rate: 1 },
      EUR: { rate: 0.9 },
    });
    expect((await rates.getHistoricalRates("2024-01-05")).ARS).toBeUndefined();
  });
  it("ignores malformed and zero observations", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [
        { casa: "blue", fecha: "2024-01-05", venta: 0 },
        { casa: "oficial", fecha: "2024-01-05", venta: 800 },
        blue[2],
      ],
    } as Response);
    expect(await rates.getHistoricalBlueSale("2024-01-05")).toMatchObject({
      rate: 900,
      date: "2024-01-04",
    });
  });
  it("shares cached history and in-flight requests but selects per date", async () => {
    const results = await Promise.all([
      rates.getHistoricalBlueSale("2024-01-05"),
      rates.getHistoricalBlueSale("2024-01-08"),
    ]);
    expect(results.map((r) => r?.rate)).toEqual([1000, 1200]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("leaves future expenses pending", async () => {
    expect(await rates.getHistoricalBlueSale("2999-01-01")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
