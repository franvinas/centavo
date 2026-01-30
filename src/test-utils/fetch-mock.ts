import { vi } from "vitest";

export function mockExchangeRateApi(
  rates: Record<string, number> = { EUR: 0.85, GBP: 0.73 },
) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ rates }),
  });
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
