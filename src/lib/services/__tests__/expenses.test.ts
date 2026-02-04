import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockExchangeRateApi } from "@/test-utils/fetch-mock";
import {
  createExpenseForUser,
  updateExpenseForUser,
  deleteExpenseForUser,
} from "../expenses";

describe("Expense Service", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockExchangeRateApi({ USD: 1, EUR: 0.85, ARS: 350 });
  });

  describe("createExpenseForUser", () => {
    it("creates an expense with exchange rate calculation", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
        baseCurrency: "USD",
      } as never);

      const mockExpense = {
        id: "exp-1",
        userId: "user-1",
        amount: 25,
        currency: "USD",
        baseAmount: 25,
        exchangeRate: 1,
        description: "Lunch",
        categoryId: "cat-1",
        date: new Date("2025-01-15"),
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
      };

      prismaMock.expense.create.mockResolvedValue(mockExpense as never);

      const result = await createExpenseForUser("user-1", {
        amount: 25,
        currency: "USD",
        description: "Lunch",
        categoryId: "cat-1",
        date: "2025-01-15",
      });

      expect(prismaMock.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            amount: 25,
            currency: "USD",
            description: "Lunch",
          }),
        }),
      );
      expect(result).toEqual(mockExpense);
    });

    it("converts currency when different from base", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
        baseCurrency: "USD",
      } as never);

      prismaMock.expense.create.mockResolvedValue({ id: "exp-1" } as never);

      await createExpenseForUser("user-1", {
        amount: 100,
        currency: "EUR",
        description: "Dinner in Europe",
        categoryId: "cat-1",
        date: "2025-01-15",
      });

      const callArgs = prismaMock.expense.create.mock.calls[0][0];
      // EUR->USD: 1/0.85 ≈ 1.1765
      expect(callArgs.data.exchangeRate).toBeCloseTo(1 / 0.85, 2);
    });

    it("throws on invalid input", async () => {
      await expect(
        createExpenseForUser("user-1", {
          amount: -5,
          currency: "USD",
          description: "Bad",
          categoryId: "cat-1",
          date: "2025-01-15",
        }),
      ).rejects.toThrow();
    });
  });

  describe("updateExpenseForUser", () => {
    it("updates expense fields", async () => {
      prismaMock.expense.findFirst.mockResolvedValue({
        id: "exp-1",
        userId: "user-1",
        amount: 25,
        currency: "USD",
      } as never);

      prismaMock.expense.update.mockResolvedValue({ id: "exp-1" } as never);

      await updateExpenseForUser("user-1", "exp-1", {
        description: "Updated lunch",
      });

      expect(prismaMock.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "exp-1" },
          data: expect.objectContaining({ description: "Updated lunch" }),
        }),
      );
    });

    it("throws when expense not found", async () => {
      prismaMock.expense.findFirst.mockResolvedValue(null);

      await expect(
        updateExpenseForUser("user-1", "nonexistent", {
          description: "Nope",
        }),
      ).rejects.toThrow("Expense not found");
    });
  });

  describe("deleteExpenseForUser", () => {
    it("deletes an owned expense", async () => {
      prismaMock.expense.findFirst.mockResolvedValue({
        id: "exp-1",
        userId: "user-1",
      } as never);

      prismaMock.expense.delete.mockResolvedValue({ id: "exp-1" } as never);

      const result = await deleteExpenseForUser("user-1", "exp-1");
      expect(result).toEqual({ success: true });
      expect(prismaMock.expense.delete).toHaveBeenCalledWith({
        where: { id: "exp-1" },
      });
    });

    it("throws when expense not found", async () => {
      prismaMock.expense.findFirst.mockResolvedValue(null);

      await expect(
        deleteExpenseForUser("user-1", "nonexistent"),
      ).rejects.toThrow("Expense not found");
    });
  });
});
