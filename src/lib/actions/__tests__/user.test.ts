import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaUser } from "@/test-utils/factories";
import { updateUser } from "../user";
import { revalidatePath } from "next/cache";

beforeEach(() => {
  resetPrismaMock();
  vi.mocked(revalidatePath).mockClear();
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

  it("changes display currency without rewriting any expense", async () => {
    mockAuth();
    prismaMock.user.update.mockResolvedValue(
      createPrismaUser({ baseCurrency: "ARS" }) as never,
    );
    await updateUser({ baseCurrency: "ARS" });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { baseCurrency: "ARS" },
    });
    expect(prismaMock.expense.findMany).not.toHaveBeenCalled();
    expect(prismaMock.expense.update).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/analytics");
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
