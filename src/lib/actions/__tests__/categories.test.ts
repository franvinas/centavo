import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaCategory } from "@/test-utils/factories";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../categories";
import { revalidatePath } from "next/cache";

beforeEach(() => {
  resetPrismaMock();
  vi.mocked(revalidatePath).mockClear();
});

const validCategoryData = {
  name: "Food",
  color: "#E8855B",
  icon: "UtensilsCrossed",
};

describe("createCategory", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(createCategory(validCategoryData)).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("creates a category", async () => {
    mockAuth();
    prismaMock.category.findUnique.mockResolvedValue(null as never);
    prismaMock.category.aggregate.mockResolvedValue({
      _max: { position: null },
    } as never);
    prismaMock.category.create.mockResolvedValue(
      createPrismaCategory() as never,
    );

    await createCategory(validCategoryData);

    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        name: "Food",
        color: "#E8855B",
        position: 0,
      }),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/categories");
  });

  it("throws for duplicate name", async () => {
    mockAuth();
    prismaMock.category.findUnique.mockResolvedValue(
      createPrismaCategory() as never,
    );

    await expect(createCategory(validCategoryData)).rejects.toThrow(
      "Category already exists",
    );
  });
});

describe("updateCategory", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(updateCategory("cat-1", { name: "Updated" })).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("updates a category", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(
      createPrismaCategory() as never,
    );
    prismaMock.category.update.mockResolvedValue({} as never);

    await updateCategory("cat-1", { name: "Updated" });

    expect(prismaMock.category.update).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/categories");
  });

  it("throws when not found", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(null as never);

    await expect(updateCategory("nonexistent", { name: "X" })).rejects.toThrow(
      "Category not found",
    );
  });

  it("throws for duplicate name on rename", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(
      createPrismaCategory({ name: "Food" }) as never,
    );
    prismaMock.category.findUnique.mockResolvedValue(
      createPrismaCategory({ name: "Transport" }) as never,
    );

    await expect(
      updateCategory("cat-1", { name: "Transport" }),
    ).rejects.toThrow("Category name already exists");
  });
});

describe("deleteCategory", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(deleteCategory("cat-1")).rejects.toThrow("Not authenticated");
  });

  it("deletes a category with no expenses", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(
      createPrismaCategory() as never,
    );
    prismaMock.expense.count.mockResolvedValue(0 as never);
    prismaMock.category.delete.mockResolvedValue({} as never);

    await deleteCategory("cat-1");

    expect(prismaMock.category.delete).toHaveBeenCalledWith({
      where: { id: "cat-1" },
    });
  });

  it("throws when category has expenses", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(
      createPrismaCategory() as never,
    );
    prismaMock.expense.count.mockResolvedValue(3 as never);

    await expect(deleteCategory("cat-1")).rejects.toThrow("3 expenses");
  });

  it("throws when not found", async () => {
    mockAuth();
    prismaMock.category.findFirst.mockResolvedValue(null as never);

    await expect(deleteCategory("nonexistent")).rejects.toThrow(
      "Category not found",
    );
  });
});

describe("reorderCategories", () => {
  it("throws when unauthenticated", async () => {
    mockUnauthenticated();
    await expect(reorderCategories(["cat-1"])).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("stores each category's new position", async () => {
    mockAuth();
    prismaMock.category.findMany.mockResolvedValue([
      { id: "cat-1" },
      { id: "cat-2" },
      { id: "cat-3" },
    ] as never);
    prismaMock.$transaction.mockResolvedValue([] as never);

    await reorderCategories(["cat-3", "cat-1", "cat-2"]);

    expect(prismaMock.category.update).toHaveBeenNthCalledWith(1, {
      where: { id: "cat-3", userId: "user-1" },
      data: { position: 0 },
    });
    expect(prismaMock.category.update).toHaveBeenNthCalledWith(2, {
      where: { id: "cat-1", userId: "user-1" },
      data: { position: 1 },
    });
    expect(prismaMock.category.update).toHaveBeenNthCalledWith(3, {
      where: { id: "cat-2", userId: "user-1" },
      data: { position: 2 },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/categories");
    expect(revalidatePath).toHaveBeenCalledWith("/expenses");
  });

  it("rejects an order that does not list every category", async () => {
    mockAuth();
    prismaMock.category.findMany.mockResolvedValue([
      { id: "cat-1" },
      { id: "cat-2" },
    ] as never);

    await expect(reorderCategories(["cat-2"])).rejects.toThrow(
      "Category list changed",
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects ids that belong to someone else", async () => {
    mockAuth();
    prismaMock.category.findMany.mockResolvedValue([
      { id: "cat-1" },
      { id: "cat-2" },
    ] as never);

    await expect(reorderCategories(["cat-1", "other"])).rejects.toThrow(
      "Category list changed",
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects duplicated ids", async () => {
    mockAuth();
    await expect(reorderCategories(["cat-1", "cat-1"])).rejects.toThrow();
    expect(prismaMock.category.findMany).not.toHaveBeenCalled();
  });
});
