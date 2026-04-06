import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { POST } from "../route";

vi.mock("@/lib/exchange-rate", () => ({
  getExchangeRate: vi.fn().mockResolvedValue(1),
}));

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

beforeEach(() => {
  resetPrismaMock();
});

describe("POST /api/expenses/import", () => {
  const item = {
    amount: 25,
    currency: "USD",
    description: "Lunch",
    categoryId: "cat-1",
    date: "2025-01-15",
  };

  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await POST(
      createRequest("/api/expenses/import", {
        method: "POST",
        body: JSON.stringify({ items: [item] }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("supports dry-run validation", async () => {
    mockAuth("user-1");
    prismaMock.category.findFirst.mockResolvedValue({ id: "cat-1" } as never);

    const res = await POST(
      createRequest("/api/expenses/import", {
        method: "POST",
        body: JSON.stringify({ items: [item], dryRun: true }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.preview).toBe(true);
    expect(body.errors).toEqual([]);
  });
});
