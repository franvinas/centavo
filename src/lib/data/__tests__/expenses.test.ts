import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import { getExpenses, getExpenseById, getExpenseSummary } from "../expenses";

beforeEach(() => {
  resetPrismaMock();
});

describe("getExpenses", () => {
  it("returns paginated expenses for a user", async () => {
    const expenses = [
      createPrismaExpense(),
      createPrismaExpense({ description: "Dinner" }),
    ];
    prismaMock.expense.findMany.mockResolvedValue(expenses as never);
    prismaMock.expense.count.mockResolvedValue(2 as never);

    const result = await getExpenses({ userId: "user-1" });

    expect(result.expenses).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: { date: "desc" },
        skip: 0,
        take: 50,
      }),
    );
  });

  it("applies date filters", async () => {
    prismaMock.expense.findMany.mockResolvedValue([] as never);
    prismaMock.expense.count.mockResolvedValue(0 as never);

    await getExpenses({
      userId: "user-1",
      from: "2025-01-01",
      to: "2025-01-31",
    });

    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-01-31"),
          },
        }),
      }),
    );
  });

  it("applies category filter", async () => {
    prismaMock.expense.findMany.mockResolvedValue([] as never);
    prismaMock.expense.count.mockResolvedValue(0 as never);

    await getExpenses({ userId: "user-1", categoryId: "cat-1" });

    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: "cat-1" }),
      }),
    );
  });

  it("applies search filter", async () => {
    prismaMock.expense.findMany.mockResolvedValue([] as never);
    prismaMock.expense.count.mockResolvedValue(0 as never);

    await getExpenses({ userId: "user-1", search: "lunch" });

    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          description: { contains: "lunch", mode: "insensitive" },
        }),
      }),
    );
  });

  it("handles pagination", async () => {
    prismaMock.expense.findMany.mockResolvedValue([] as never);
    prismaMock.expense.count.mockResolvedValue(100 as never);

    const result = await getExpenses({ userId: "user-1", page: 2, limit: 10 });

    expect(result.totalPages).toBe(10);
    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});

describe("getExpenseById", () => {
  it("returns expense for matching id and userId", async () => {
    const expense = createPrismaExpense();
    prismaMock.expense.findFirst.mockResolvedValue(expense as never);

    const result = await getExpenseById("exp-1", "user-1");

    expect(result).toEqual(expense);
    expect(prismaMock.expense.findFirst).toHaveBeenCalledWith({
      where: { id: "exp-1", userId: "user-1" },
      include: { category: true },
    });
  });

  it("returns null when not found", async () => {
    prismaMock.expense.findFirst.mockResolvedValue(null as never);

    const result = await getExpenseById("nonexistent", "user-1");
    expect(result).toBeNull();
  });
});

describe("getExpenseSummary", () => {
  it("returns summary with totals", async () => {
    const currentExpenses = [
      createPrismaExpense({ baseAmount: 100 }),
      createPrismaExpense({ baseAmount: 50 }),
    ];
    const lastMonthExpenses = [createPrismaExpense({ baseAmount: 200 })];

    prismaMock.expense.findMany
      .mockResolvedValueOnce(currentExpenses as never)
      .mockResolvedValueOnce(lastMonthExpenses as never);

    const result = await getExpenseSummary("user-1");

    expect(result.totalSpent).toBe(150);
    expect(result.expenseCount).toBe(2);
    expect(result.lastMonthTotal).toBe(200);
    expect(result.lastMonthCount).toBe(1);
    expect(result.recentExpenses).toHaveLength(2);
  });
});
