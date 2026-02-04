import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaExpense } from "@/test-utils/factories";
import { createExpense, updateExpense, deleteExpense } from "../expenses";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/exchange-rate", () => ({
  getExchangeRate: vi.fn().mockResolvedValue(1),
}));

beforeEach(() => {
  resetPrismaMock();
  vi.mocked(revalidatePath).mockClear();
});

const validExpenseData = {
  amount: 25.5,
  currency: "USD",
  description: "Lunch",
  categoryId: "cat-1",
  date: "2025-01-15",
};

describe("createExpense", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(createExpense(validExpenseData)).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("creates expense with exchange rate calculation", async () => {
    mockAuth();
    prismaMock.user.findUnique.mockResolvedValue({
      baseCurrency: "USD",
    } as never);
    prismaMock.expense.create.mockResolvedValue(createPrismaExpense() as never);

    await createExpense(validExpenseData);

    expect(prismaMock.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          amount: 25.5,
          currency: "USD",
          description: "Lunch",
          categoryId: "cat-1",
          baseAmount: 25.5,
          exchangeRate: 1,
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/expenses");
  });

  it("throws on validation failure", async () => {
    mockAuth();
    await expect(
      createExpense({ ...validExpenseData, amount: -1 }),
    ).rejects.toThrow();
  });
});

describe("updateExpense", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(
      updateExpense("exp-1", { description: "Updated" }),
    ).rejects.toThrow("Not authenticated");
  });

  it("updates expense description", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(
      createPrismaExpense() as never,
    );
    prismaMock.expense.update.mockResolvedValue({} as never);

    await updateExpense("exp-1", { description: "Updated" });

    expect(prismaMock.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "exp-1" },
        data: expect.objectContaining({ description: "Updated" }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("throws when expense not found", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(null as never);

    await expect(
      updateExpense("nonexistent", { description: "X" }),
    ).rejects.toThrow("Expense not found");
  });

  it("recalculates on amount change", async () => {
    mockAuth();
    const existing = createPrismaExpense();
    prismaMock.expense.findFirst.mockResolvedValue(existing as never);
    prismaMock.user.findUnique.mockResolvedValue({
      baseCurrency: "USD",
    } as never);
    prismaMock.expense.update.mockResolvedValue({} as never);

    await updateExpense("exp-1", { amount: 100 });

    expect(prismaMock.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "exp-1" },
        data: expect.objectContaining({
          amount: 100,
          baseAmount: 100,
          exchangeRate: 1,
        }),
      }),
    );
  });
});

describe("deleteExpense", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(deleteExpense("exp-1")).rejects.toThrow("Not authenticated");
  });

  it("deletes expense", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(
      createPrismaExpense() as never,
    );
    prismaMock.expense.delete.mockResolvedValue({} as never);

    await deleteExpense("exp-1");

    expect(prismaMock.expense.delete).toHaveBeenCalledWith({
      where: { id: "exp-1" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/expenses");
  });

  it("throws when expense not found", async () => {
    mockAuth();
    prismaMock.expense.findFirst.mockResolvedValue(null as never);

    await expect(deleteExpense("nonexistent")).rejects.toThrow(
      "Expense not found",
    );
  });
});
