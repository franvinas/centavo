import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import { GET } from "../route";

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

beforeEach(() => {
  resetPrismaMock();
});

describe("GET /api/expenses/export", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();

    const res = await GET(createRequest("/api/expenses/export"));

    expect(res.status).toBe(401);
  });

  it("exports expenses selected by search without requiring ids", async () => {
    mockAuth("user-1");
    prismaMock.expense.findMany.mockResolvedValue([
      createPrismaExpense({ description: "Lunch export" }),
    ] as never);

    const res = await GET(createRequest("/api/expenses/export?search=Lunch"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.expenses).toHaveLength(1);
    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          description: { contains: "Lunch", mode: "insensitive" },
        }),
      }),
    );
  });
});
