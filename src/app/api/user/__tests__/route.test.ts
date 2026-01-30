import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaUser, createPrismaExpense } from "@/test-utils/factories";
import { GET, PUT } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/exchange-rate", () => ({
  getExchangeRate: vi.fn().mockResolvedValue(0.85),
}));

function createRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

beforeEach(() => {
  resetPrismaMock();
});

describe("GET /api/user", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns current user", async () => {
    mockAuth();
    const user = createPrismaUser();
    prismaMock.user.findUnique.mockResolvedValue(user as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe("test@example.com");
  });
});

describe("PUT /api/user", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await PUT(
      createRequest("/api/user", {
        method: "PUT",
        body: JSON.stringify({ name: "New Name" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("updates user name", async () => {
    mockAuth();
    const user = createPrismaUser();
    prismaMock.user.findUnique.mockResolvedValue(user as never);
    prismaMock.user.update.mockResolvedValue({
      ...user,
      name: "New Name",
    } as never);

    const res = await PUT(
      createRequest("/api/user", {
        method: "PUT",
        body: JSON.stringify({ name: "New Name" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it("recalculates expenses on currency change", async () => {
    mockAuth();
    const user = createPrismaUser({ baseCurrency: "USD" });
    prismaMock.user.findUnique.mockResolvedValue(user as never);
    prismaMock.user.update.mockResolvedValue({
      ...user,
      baseCurrency: "EUR",
    } as never);

    const expenses = [createPrismaExpense({ amount: 100, currency: "USD" })];
    prismaMock.expense.findMany.mockResolvedValue(expenses as never);
    prismaMock.expense.update.mockResolvedValue({} as never);

    const res = await PUT(
      createRequest("/api/user", {
        method: "PUT",
        body: JSON.stringify({ baseCurrency: "EUR" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(prismaMock.expense.findMany).toHaveBeenCalled();
    expect(prismaMock.expense.update).toHaveBeenCalled();
  });

  it("returns 400 for invalid input", async () => {
    mockAuth();
    const res = await PUT(
      createRequest("/api/user", {
        method: "PUT",
        body: JSON.stringify({ baseCurrency: "XX" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
