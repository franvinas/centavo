import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaExpense, createPrismaUser } from "@/test-utils/factories";
import { GET, POST } from "../route";
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

beforeEach(() => {
  resetPrismaMock();
});

describe("GET /api/expenses", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await GET(createRequest("/api/expenses"));
    expect(res.status).toBe(401);
  });

  it("returns paginated expenses", async () => {
    mockAuth();
    const expenses = [createPrismaExpense()];
    prismaMock.expense.findMany.mockResolvedValue(expenses as never);
    prismaMock.expense.count.mockResolvedValue(1 as never);

    const res = await GET(createRequest("/api/expenses"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.expenses).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
  });

  it("applies query filters", async () => {
    mockAuth();
    prismaMock.expense.findMany.mockResolvedValue([] as never);
    prismaMock.expense.count.mockResolvedValue(0 as never);

    await GET(
      createRequest(
        "/api/expenses?search=lunch&categoryId=cat-1&from=2025-01-01&to=2025-01-31",
      ),
    );

    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          description: { contains: "lunch", mode: "insensitive" },
          categoryId: "cat-1",
        }),
      }),
    );
  });

  it("handles pagination params", async () => {
    mockAuth();
    prismaMock.expense.findMany.mockResolvedValue([] as never);
    prismaMock.expense.count.mockResolvedValue(50 as never);

    const res = await GET(createRequest("/api/expenses?page=2&limit=10"));
    const body = await res.json();

    expect(body.totalPages).toBe(5);
    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});

describe("POST /api/expenses", () => {
  const validBody = {
    amount: 25.5,
    currency: "USD",
    description: "Lunch",
    categoryId: "cat-1",
    date: "2025-01-15",
  };

  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const res = await POST(
      createRequest("/api/expenses", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates an expense", async () => {
    mockAuth();
    const expense = createPrismaExpense();
    prismaMock.user.findUnique.mockResolvedValue({
      baseCurrency: "USD",
    } as never);
    prismaMock.expense.create.mockResolvedValue(expense as never);

    const res = await POST(
      createRequest("/api/expenses", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.expense).toBeDefined();
    expect(prismaMock.expense.create).toHaveBeenCalled();
  });

  it("returns 400 for invalid input", async () => {
    mockAuth();
    const res = await POST(
      createRequest("/api/expenses", {
        method: "POST",
        body: JSON.stringify({ amount: -1 }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
