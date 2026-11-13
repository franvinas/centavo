import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { createPrismaCategory } from "@/test-utils/factories";
import { getCategories } from "../categories";

beforeEach(() => {
  resetPrismaMock();
});

describe("getCategories", () => {
  it("returns categories in the user's chosen order", async () => {
    const categories = [
      createPrismaCategory({ name: "Food" }),
      createPrismaCategory({ name: "Transport" }),
    ];
    prismaMock.category.findMany.mockResolvedValue(categories as never);

    const result = await getCategories("user-1");

    expect(result).toHaveLength(2);
    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
  });

  it("returns empty array when user has no categories", async () => {
    prismaMock.category.findMany.mockResolvedValue([] as never);

    const result = await getCategories("user-1");
    expect(result).toEqual([]);
  });
});
