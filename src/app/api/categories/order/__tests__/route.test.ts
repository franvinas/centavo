import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { PUT } from "../route";

function createRequest(body: unknown) {
  return new NextRequest(
    new URL("/api/categories/order", "http://localhost:3000"),
    { method: "PUT", body: JSON.stringify(body) },
  );
}

beforeEach(() => {
  resetPrismaMock();
});

describe("PUT /api/categories/order", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await PUT(createRequest({ ids: ["cat-1"] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid body", async () => {
    mockAuth();
    const res = await PUT(createRequest({ ids: [] }));
    expect(res.status).toBe(400);
  });

  it("saves the new order", async () => {
    mockAuth();
    prismaMock.category.findMany.mockResolvedValue([
      { id: "cat-1" },
      { id: "cat-2" },
    ] as never);
    prismaMock.$transaction.mockResolvedValue([] as never);

    const res = await PUT(createRequest({ ids: ["cat-2", "cat-1"] }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(prismaMock.category.update).toHaveBeenCalledWith({
      where: { id: "cat-2", userId: "user-1" },
      data: { position: 0 },
    });
  });

  it("returns 409 when the list is out of date", async () => {
    mockAuth();
    prismaMock.category.findMany.mockResolvedValue([
      { id: "cat-1" },
      { id: "cat-2" },
      { id: "cat-3" },
    ] as never);

    const res = await PUT(createRequest({ ids: ["cat-2", "cat-1"] }));

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("CONFLICT");
  });
});
