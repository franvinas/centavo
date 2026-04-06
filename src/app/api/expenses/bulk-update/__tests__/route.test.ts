import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaExpense } from "@/test-utils/factories";
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

describe("POST /api/expenses/bulk-update", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await POST(
      createRequest("/api/expenses/bulk-update", {
        method: "POST",
        body: JSON.stringify({
          selectors: { search: "Lunch" },
          data: { notes: "Updated" },
        }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("returns a preview of matched expenses", async () => {
    mockAuth("user-1");
    prismaMock.expense.findMany.mockResolvedValue([
      createPrismaExpense(),
    ] as never);

    const res = await POST(
      createRequest("/api/expenses/bulk-update", {
        method: "POST",
        body: JSON.stringify({
          selectors: { search: "Lunch" },
          preview: true,
          data: { notes: "Updated" },
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.preview).toBe(true);
    expect(body.matched).toBe(1);
  });
});
