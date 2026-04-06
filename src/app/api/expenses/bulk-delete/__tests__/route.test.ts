import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import { POST } from "../route";

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

beforeEach(() => {
  resetPrismaMock();
});

describe("POST /api/expenses/bulk-delete", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await POST(
      createRequest("/api/expenses/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ selectors: { search: "Lunch" } }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("deletes matching expenses", async () => {
    mockAuth("user-1");
    prismaMock.expense.findMany.mockResolvedValue([
      createPrismaExpense({ id: "exp-1" }),
    ] as never);
    prismaMock.expense.deleteMany.mockResolvedValue({ count: 1 } as never);

    const res = await POST(
      createRequest("/api/expenses/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ selectors: { search: "Lunch" } }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.changed).toBe(1);
    expect(body.ids).toEqual(["exp-1"]);
  });
});
