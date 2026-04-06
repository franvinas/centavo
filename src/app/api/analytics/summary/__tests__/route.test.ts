import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { prismaMock } from "@/test-utils/prisma-mock";
import { GET } from "../route";

function createRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

vi.mock("@/lib/data/analytics", () => ({
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    totalSpent: 120,
    transactionCount: 3,
    dailyAverage: 10,
  }),
}));

describe("GET /api/analytics/summary", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await GET(createRequest("/api/analytics/summary"));
    expect(res.status).toBe(401);
  });

  it("returns analytics summary with base currency", async () => {
    mockAuth("user-1");
    prismaMock.user.findUnique.mockResolvedValue({
      baseCurrency: "USD",
    } as never);

    const res = await GET(createRequest("/api/analytics/summary"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.totalSpent).toBe(120);
    expect(body.baseCurrency).toBe("USD");
  });
});
