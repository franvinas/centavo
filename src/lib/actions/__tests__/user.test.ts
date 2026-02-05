import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaUser, createPrismaExpense } from "@/test-utils/factories";
import { updateUser } from "../user";
import { revalidatePath } from "next/cache";

// Mock next/server's after() - capture the promise so tests can await it
let afterPromise: Promise<void> | null = null;
vi.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => {
    afterPromise = callback();
  },
}));

vi.mock("@/lib/exchange-rate", () => ({
  getExchangeRate: vi.fn().mockResolvedValue(0.85),
}));

beforeEach(() => {
  resetPrismaMock();
  vi.mocked(revalidatePath).mockClear();
  afterPromise = null;
});

describe("updateUser", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(updateUser({ name: "New Name" })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("updates user name", async () => {
    mockAuth();
    const user = createPrismaUser();
    prismaMock.user.findUnique.mockResolvedValue(user as never);
    prismaMock.user.update.mockResolvedValue({
      ...user,
      name: "New Name",
    } as never);

    await updateUser({ name: "New Name" });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "New Name" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("recalculates all expenses on currency change", async () => {
    mockAuth();
    const user = createPrismaUser({ baseCurrency: "USD" });
    prismaMock.user.findUnique.mockResolvedValue(user as never);
    prismaMock.user.update.mockResolvedValue({
      ...user,
      baseCurrency: "EUR",
    } as never);

    const expenses = [
      createPrismaExpense({ id: "e1", amount: 100, currency: "USD" }),
      createPrismaExpense({ id: "e2", amount: 50, currency: "GBP" }),
    ];
    prismaMock.expense.findMany.mockResolvedValue(expenses as never);
    prismaMock.expense.update.mockResolvedValue({} as never);

    await updateUser({ baseCurrency: "EUR" });
    // Wait for the after() callback to complete
    await afterPromise;

    expect(prismaMock.expense.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    // Should update each expense
    expect(prismaMock.expense.update).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("does not recalculate if currency unchanged", async () => {
    mockAuth();
    const user = createPrismaUser({ baseCurrency: "USD" });
    prismaMock.user.findUnique.mockResolvedValue(user as never);
    prismaMock.user.update.mockResolvedValue(user as never);

    await updateUser({ baseCurrency: "USD" });

    expect(prismaMock.expense.findMany).not.toHaveBeenCalled();
  });
});
