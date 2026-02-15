import { describe, it, expect, vi } from "vitest";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { GET } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/exchange-rate", () => ({
  getExchangeRate: vi.fn().mockResolvedValue(0.85),
}));

// Need to import prisma mock to ensure db module is mocked (auth-mock depends on it indirectly)
import "@/test-utils/prisma-mock";

function createRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/exchange-rate", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await GET(createRequest("/api/exchange-rate?from=USD&to=EUR"));
    expect(res.status).toBe(401);
  });

  it("returns exchange rate", async () => {
    mockAuth();
    const res = await GET(createRequest("/api/exchange-rate?from=USD&to=EUR"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.from).toBe("USD");
    expect(body.to).toBe("EUR");
    expect(body.rate).toBe(0.85);
    expect(body.timestamp).toBeDefined();
  });

  it("returns 400 when params missing", async () => {
    mockAuth();
    const res = await GET(createRequest("/api/exchange-rate?from=USD"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when both params missing", async () => {
    mockAuth();
    const res = await GET(createRequest("/api/exchange-rate"));
    expect(res.status).toBe(400);
  });
});
