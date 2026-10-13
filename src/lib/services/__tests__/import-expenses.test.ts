import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import { importExpensesForUser, updateExpenseForUser } from "../expenses";

vi.mock("@/lib/exchange-rate", () => ({
  getHistoricalRates: vi.fn(async (date: string) => ({
    USD: { rate: 1, date, source: "identity" },
  })),
}));
const valid = {
  amount: 25,
  currency: "USD",
  description: "Lunch",
  categoryId: "cat-1",
  date: "2025-01-15",
};
beforeEach(() => {
  resetPrismaMock();
  prismaMock.user.findUnique.mockResolvedValue({
    baseCurrency: "USD",
  } as never);
  prismaMock.category.findFirst.mockResolvedValue({ id: "cat-1" } as never);
  prismaMock.expense.create.mockResolvedValue(createPrismaExpense() as never);
});
describe("per-row import validation", () => {
  it("imports valid rows and reports original indices for invalid rows", async () => {
    const result = await importExpensesForUser("user-1", {
      continueOnError: true,
      items: [
        valid,
        { ...valid, amount: -1 },
        null,
        { ...valid, currency: "usd", description: " Dinner " },
      ],
    });
    expect(result.created).toBe(2);
    expect(result.errors.map((e) => e.index)).toEqual([1, 2]);
    expect(prismaMock.expense.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.expense.create.mock.calls[1][0].data).toMatchObject({
      currency: "USD",
      description: "Dinner",
    });
  });
  it("makes no writes when strict mode contains any invalid row", async () => {
    await expect(
      importExpensesForUser("user-1", {
        items: [valid, { ...valid, date: "invalid" }],
      }),
    ).rejects.toThrow("Row 2");
    expect(prismaMock.expense.create).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
  it("reports invalid rows in dry-run without writing any expenses", async () => {
    const result = await importExpensesForUser("user-1", {
      dryRun: true,
      items: [valid, { ...valid, amount: 0 }, null],
    });
    expect(result.errors.map((e) => e.index)).toEqual([1, 2]);
    expect(result.preview).toBe(true);
    expect(prismaMock.expense.create).not.toHaveBeenCalled();
  });
  it("continues after foreign-category errors without exposing another user's category", async () => {
    prismaMock.category.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "cat-1" } as never);
    const result = await importExpensesForUser("user-1", {
      continueOnError: true,
      items: [valid, { ...valid, description: "Dinner" }],
    });
    expect(result.created).toBe(1);
    expect(result.errors).toEqual([
      { index: 0, message: "Category not found" },
    ]);
    expect(prismaMock.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cat-1", userId: "user-1" } }),
    );
  });
  it("does not create anything when every row is invalid", async () => {
    const result = await importExpensesForUser("user-1", {
      continueOnError: true,
      items: [null, { ...valid, currency: "XXX" }],
    });
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(2);
    expect(prismaMock.expense.create).not.toHaveBeenCalled();
  });
  it("clears notes when empty text is provided and preserves them when omitted", async () => {
    prismaMock.expense.findFirst.mockResolvedValue(
      createPrismaExpense({ notes: "Old notes" }) as never,
    );
    prismaMock.expense.update.mockResolvedValue(
      createPrismaExpense({ notes: null }) as never,
    );
    await updateExpenseForUser("user-1", "exp-1", { notes: "   " });
    expect(prismaMock.expense.update.mock.calls[0][0].data.notes).toBeNull();
    await updateExpenseForUser("user-1", "exp-1", { description: "Updated" });
    expect(prismaMock.expense.update.mock.calls[1][0].data).not.toHaveProperty(
      "notes",
    );
  });
});
