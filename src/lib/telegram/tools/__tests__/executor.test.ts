import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { executeTool } from "../executor";

vi.mock("@/lib/services/expenses", () => ({
  createExpenseForUser: vi.fn(),
  updateExpenseForUser: vi.fn(),
  deleteExpenseForUser: vi.fn(),
}));

vi.mock("@/lib/data/expenses", () => ({
  getExpenses: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

vi.mock("@/lib/data/analytics", () => ({
  getSpendingByCategory: vi.fn(),
}));

vi.mock("@/lib/data/categories", () => ({
  getCategories: vi.fn(),
}));

import { createExpenseForUser } from "@/lib/services/expenses";
import { getExpenses, getExpenseSummary } from "@/lib/data/expenses";
import { getSpendingByCategory } from "@/lib/data/analytics";
import { getCategories } from "@/lib/data/categories";

const mockCreateExpense = vi.mocked(createExpenseForUser);
const mockGetExpenses = vi.mocked(getExpenses);
const mockGetSummary = vi.mocked(getExpenseSummary);
const mockGetSpendingByCategory = vi.mocked(getSpendingByCategory);
const mockGetCategories = vi.mocked(getCategories);

describe("executeTool", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.clearAllMocks();
  });

  it("add_expense calls createExpenseForUser and serializes result", async () => {
    mockCreateExpense.mockResolvedValue({
      id: "exp-1",
      description: "Lunch",
      amount: 25 as never,
      currency: "USD",
      baseAmount: 25 as never,
      exchangeRate: 1 as never,
      date: new Date("2025-01-15"),
      categoryId: "cat-1",
      userId: "user-1",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: "cat-1",
        name: "Food",
        color: "#E8855B",
        icon: "UtensilsCrossed",
        userId: "user-1",
        createdAt: new Date(),
      },
    });

    const result = JSON.parse(
      await executeTool("user-1", "add_expense", {
        amount: 25,
        currency: "USD",
        description: "Lunch",
        categoryId: "cat-1",
        date: "2025-01-15",
      }),
    );

    expect(result.id).toBe("exp-1");
    expect(result.amount).toBe(25);
    expect(result.date).toBe("2025-01-15");
    expect(result.category.name).toBe("Food");
  });

  it("list_expenses returns serialized expenses", async () => {
    mockGetExpenses.mockResolvedValue({
      expenses: [
        {
          id: "exp-1",
          description: "Coffee",
          amount: 5 as never,
          currency: "USD",
          baseAmount: 5 as never,
          exchangeRate: 1 as never,
          date: new Date("2025-01-15"),
          categoryId: "cat-1",
          userId: "user-1",
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: {
            id: "cat-1",
            name: "Food",
            color: "#E8855B",
            icon: "UtensilsCrossed",
            userId: "user-1",
            createdAt: new Date(),
          },
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const result = JSON.parse(
      await executeTool("user-1", "list_expenses", { limit: 5 }),
    );

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Coffee");
  });

  it("add_expense defaults date using user's timezone when missing", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-02-06T00:30:00.000Z"));
      prismaMock.user.findUnique.mockResolvedValue({
        timezone: "America/Argentina/Buenos_Aires",
      } as never);
      mockCreateExpense.mockResolvedValue({
        id: "exp-2",
        description: "Dinner",
        amount: 40 as never,
        currency: "ARS",
        baseAmount: 40 as never,
        exchangeRate: 1 as never,
        date: new Date("2026-02-05"),
        categoryId: "cat-1",
        userId: "user-1",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: "cat-1",
          name: "Food",
          color: "#E8855B",
          icon: "UtensilsCrossed",
          userId: "user-1",
          createdAt: new Date(),
        },
      });

      await executeTool("user-1", "add_expense", {
        amount: 40,
        currency: "ARS",
        description: "Dinner",
        categoryId: "cat-1",
      });

      expect(mockCreateExpense).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ date: "2026-02-05" }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("list_categories returns categories", async () => {
    mockGetCategories.mockResolvedValue([
      {
        id: "cat-1",
        name: "Food",
        icon: "UtensilsCrossed",
        color: "#E8855B",
        userId: "user-1",
        createdAt: new Date(),
      },
    ]);

    const result = JSON.parse(
      await executeTool("user-1", "list_categories", {}),
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Food");
  });

  it("get_summary returns summary data", async () => {
    mockGetSummary.mockResolvedValue({
      totalSpent: 150,
      expenseCount: 5,
      lastMonthTotal: 200,
      lastMonthCount: 8,
      recentExpenses: [],
    });

    const result = JSON.parse(await executeTool("user-1", "get_summary", {}));

    expect(result.totalSpent).toBe(150);
    expect(result.expenseCount).toBe(5);
  });

  it("get_analytics_by_category returns category breakdown", async () => {
    mockGetSpendingByCategory.mockResolvedValue([
      {
        categoryId: "cat-1",
        name: "Food",
        color: "#E8855B",
        icon: "UtensilsCrossed",
        total: 100,
        count: 3,
      },
    ]);

    const result = JSON.parse(
      await executeTool("user-1", "get_analytics_by_category", {
        from: "2025-01-01",
        to: "2025-01-31",
      }),
    );

    expect(result[0].name).toBe("Food");
    expect(result[0].total).toBe(100);
  });

  it("returns error for unknown tool", async () => {
    const result = JSON.parse(await executeTool("user-1", "unknown_tool", {}));
    expect(result.error).toContain("Unknown tool");
  });
});
