import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaCategory } from "@/test-utils/factories";
import { PUT, DELETE } from "../route";
import { NextRequest } from "next/server";

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

const routeParams = { params: Promise.resolve({ id: "cat-1" }) };

beforeEach(() => {
  resetPrismaMock();
});

describe("PUT /api/categories/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await PUT(
      createRequest("/api/categories/cat-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      }),
      routeParams,
    );
    expect(res.status).toBe(401);
  });

  it("updates a category", async () => {
    mockAuth();
    const existing = createPrismaCategory();
    prismaMock.category.findFirst.mockResolvedValue(existing as never);
    prismaMock.category.update.mockResolvedValue({
      ...existing,
      name: "Updated",
    } as never);

    const res = await PUT(
      createRequest("/api/categories/cat-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      }),
      routeParams,
    );

    expect(res.status).toBe(200);
    expect(prismaMock.category.update).toHaveBeenCalled();
  });

  it("returns 404 when not found", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(null as never);

    const res = await PUT(
      createRequest("/api/categories/cat-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      }),
      routeParams,
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for duplicate name", async () => {
    mockAuth();
    const existing = createPrismaCategory({ name: "Food" });
    prismaMock.category.findFirst.mockResolvedValue(existing as never);
    prismaMock.category.findUnique.mockResolvedValue(
      createPrismaCategory({ name: "Transport" }) as never,
    );

    const res = await PUT(
      createRequest("/api/categories/cat-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Transport" }),
      }),
      routeParams,
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/categories/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await DELETE(
      createRequest("/api/categories/cat-1"),
      routeParams,
    );
    expect(res.status).toBe(401);
  });

  it("deletes a category with no expenses", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(
      createPrismaCategory() as never,
    );
    prismaMock.expense.count.mockResolvedValue(0 as never);
    prismaMock.category.delete.mockResolvedValue({} as never);

    const res = await DELETE(
      createRequest("/api/categories/cat-1"),
      routeParams,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 400 when category has expenses", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(
      createPrismaCategory() as never,
    );
    prismaMock.expense.count.mockResolvedValue(5 as never);

    const res = await DELETE(
      createRequest("/api/categories/cat-1"),
      routeParams,
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("5 expenses");
  });

  it("returns 404 when not found", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(null as never);

    const res = await DELETE(
      createRequest("/api/categories/cat-1"),
      routeParams,
    );
    expect(res.status).toBe(404);
  });
});
