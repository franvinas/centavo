import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import { GET, PUT, DELETE } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/exchange-rate", () => ({
  getExchangeRate: vi.fn().mockResolvedValue(1),
}));

function createRequest(
  url: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

const routeParams = { params: Promise.resolve({ id: "exp-1" }) };

beforeEach(() => {
  resetPrismaMock();
});

describe("GET /api/expenses/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await GET(createRequest("/api/expenses/exp-1"), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns expense by id", async () => {
    mockAuth();
    const expense = createPrismaExpense();
    prismaMock.expense.findFirst.mockResolvedValue(expense as never);

    const res = await GET(createRequest("/api/expenses/exp-1"), routeParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.expense).toBeDefined();
  });

  it("returns 404 when not found", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(null as never);

    const res = await GET(createRequest("/api/expenses/exp-1"), routeParams);
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/expenses/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await PUT(
      createRequest("/api/expenses/exp-1", {
        method: "PUT",
        body: JSON.stringify({ description: "Updated" }),
      }),
      routeParams,
    );
    expect(res.status).toBe(401);
  });

  it("updates an expense", async () => {
    mockAuth();
    const existing = createPrismaExpense();
    prismaMock.expense.findFirst.mockResolvedValue(existing as never);
    prismaMock.expense.update.mockResolvedValue({
      ...existing,
      description: "Updated",
    } as never);

    const res = await PUT(
      createRequest("/api/expenses/exp-1", {
        method: "PUT",
        body: JSON.stringify({ description: "Updated" }),
      }),
      routeParams,
    );

    expect(res.status).toBe(200);
    expect(prismaMock.expense.update).toHaveBeenCalled();
  });

  it("returns 404 when expense not found", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(null as never);

    const res = await PUT(
      createRequest("/api/expenses/exp-1", {
        method: "PUT",
        body: JSON.stringify({ description: "Updated" }),
      }),
      routeParams,
    );
    expect(res.status).toBe(404);
  });

  it("recalculates base amount on amount change", async () => {
    mockAuth();
    const existing = createPrismaExpense();
    prismaMock.expense.findFirst.mockResolvedValue(existing as never);
    prismaMock.user.findUnique.mockResolvedValue({
      baseCurrency: "USD",
    } as never);
    prismaMock.expense.update.mockResolvedValue(existing as never);

    await PUT(
      createRequest("/api/expenses/exp-1", {
        method: "PUT",
        body: JSON.stringify({ amount: 50 }),
      }),
      routeParams,
    );

    expect(prismaMock.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 50,
          baseAmount: 50,
          exchangeRate: 1,
        }),
      }),
    );
  });
});

describe("DELETE /api/expenses/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await DELETE(createRequest("/api/expenses/exp-1"), routeParams);
    expect(res.status).toBe(401);
  });

  it("deletes an expense", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(
      createPrismaExpense() as never,
    );
    prismaMock.expense.delete.mockResolvedValue({} as never);

    const res = await DELETE(createRequest("/api/expenses/exp-1"), routeParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 404 when expense not found", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(null as never);

    const res = await DELETE(createRequest("/api/expenses/exp-1"), routeParams);
    expect(res.status).toBe(404);
  });
});
