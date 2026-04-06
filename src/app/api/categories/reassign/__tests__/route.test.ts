import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
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

describe("POST /api/categories/reassign", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await POST(
      createRequest("/api/categories/reassign", {
        method: "POST",
        body: JSON.stringify({
          fromCategoryId: "cat-1",
          toCategoryId: "cat-2",
        }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("reassigns expenses between categories", async () => {
    mockAuth("user-1");
    prismaMock.category.findMany.mockResolvedValue([
      { id: "cat-1" },
      { id: "cat-2" },
    ] as never);
    prismaMock.expense.updateMany.mockResolvedValue({ count: 3 } as never);

    const res = await POST(
      createRequest("/api/categories/reassign", {
        method: "POST",
        body: JSON.stringify({
          fromCategoryId: "cat-1",
          toCategoryId: "cat-2",
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.reassigned).toBe(3);
  });
});
