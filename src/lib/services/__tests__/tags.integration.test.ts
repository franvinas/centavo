// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { mockExchangeRateApi } from "@/test-utils/fetch-mock";
import {
  bulkUpdateExpensesForUser,
  createExpenseForUser,
  importExpensesForUser,
  listExpensesForUser,
  updateExpenseForUser,
  deleteExpenseForUser,
} from "@/lib/services/expenses";
import {
  deleteTagForUser,
  listTagNamesForUser,
  listTagsWithTotalsForUser,
  renameTagForUser,
} from "@/lib/services/tags";
import { getExpenses } from "@/lib/data/expenses";
import { getSpendingByTag } from "@/lib/data/analytics";

const url = process.env.AUDIT_TEST_DATABASE_URL;
const userId = `tags-${randomUUID()}`;
const otherUserId = `tags-other-${randomUUID()}`;
const categoryId = `${userId}-food`;
const otherCategoryId = `${otherUserId}-food`;

const base = {
  currency: "USD",
  categoryId,
  date: "2026-01-10",
};

function names(expense: { tags: Array<{ name: string }> }) {
  return expense.tags.map((tag) => tag.name);
}

describe.skipIf(!url)("expense tags (database)", () => {
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (!["localhost", "127.0.0.1"].includes(parsed.hostname))
      throw new Error("Integration tests require a disposable local database");
    process.env.DATABASE_URL = url;
    // ARS 1000 per USD, EUR 0.5 per USD.
    mockExchangeRateApi({ ARS: 1000, EUR: 0.5 });
    for (const [id, cat] of [
      [userId, categoryId],
      [otherUserId, otherCategoryId],
    ]) {
      await prisma.user.create({
        data: { id, email: `${id}@example.test`, name: "Tags" },
      });
      await prisma.category.create({
        data: { id: cat, userId: id, name: "Food", color: "#E8855B" },
      });
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } },
    });
    await prisma.$disconnect();
    vi.unstubAllGlobals();
  });

  let sushiId = "";
  let hotelId = "";
  let plainId = "";

  it("creates expenses with and without tags", async () => {
    const plain = await createExpenseForUser(userId, {
      ...base,
      amount: 5,
      description: "Coffee",
    });
    expect(plain.tags).toEqual([]);
    plainId = plain.id;

    const sushi = await createExpenseForUser(userId, {
      ...base,
      amount: 30,
      description: "Sushi",
      tags: ["Japan Trip", "#food-out", "japan trip"],
    });
    expect(names(sushi)).toEqual(["food-out", "japan trip"]);
    sushiId = sushi.id;

    const hotel = await createExpenseForUser(userId, {
      ...base,
      amount: 100000,
      currency: "ARS",
      description: "Hotel",
      tags: ["japan trip", "reimbursable"],
    });
    expect(names(hotel)).toEqual(["japan trip", "reimbursable"]);
    hotelId = hotel.id;

    // Tags are reused, not duplicated.
    expect(await listTagNamesForUser(userId)).toEqual([
      "food-out",
      "japan trip",
      "reimbursable",
    ]);
  });

  it("filters by any of the selected tags and totals the matches", async () => {
    const oneTag = await getExpenses({ userId, tags: ["reimbursable"] });
    expect(oneTag.expenses.map((e) => e.description)).toEqual(["Hotel"]);
    expect(oneTag.totalAmount).toBe(100);

    const anyOf = await getExpenses({
      userId,
      tags: ["food-out", "reimbursable"],
    });
    expect(anyOf.total).toBe(2);
    // OR semantics: Sushi (30) + Hotel (100000 ARS = 100 USD), counted once.
    expect(anyOf.totalAmount).toBe(130);

    const shared = await getExpenses({ userId, tags: ["japan trip"] });
    expect(shared.total).toBe(2);
    expect(shared.totalAmount).toBe(130);

    const none = await getExpenses({ userId, tags: ["missing"] });
    expect(none.total).toBe(0);
    expect(none.totalAmount).toBe(0);

    const all = await getExpenses({ userId });
    expect(all.total).toBe(3);
    expect(all.totalAmount).toBe(135);

    const combined = await getExpenses({
      userId,
      tags: ["japan trip"],
      search: "sush",
    });
    expect(combined.expenses.map((e) => e.description)).toEqual(["Sushi"]);
    expect(combined.totalAmount).toBe(30);
  });

  it("reports per-tag counts and totals in the display currency", async () => {
    const tags = await listTagsWithTotalsForUser(userId);
    expect(
      tags.map(({ name, expenseCount, total, currency }) => ({
        name,
        expenseCount,
        total,
        currency,
      })),
    ).toEqual([
      { name: "food-out", expenseCount: 1, total: 30, currency: "USD" },
      { name: "japan trip", expenseCount: 2, total: 130, currency: "USD" },
      { name: "reimbursable", expenseCount: 1, total: 100, currency: "USD" },
    ]);

    await prisma.user.update({
      where: { id: userId },
      data: { baseCurrency: "ARS" },
    });
    const inArs = await listTagsWithTotalsForUser(userId);
    expect(inArs.find((t) => t.name === "japan trip")?.total).toBe(130000);
    expect(
      (await getExpenses({ userId, tags: ["japan trip"] })).totalAmount,
    ).toBe(130000);
    await prisma.user.update({
      where: { id: userId },
      data: { baseCurrency: "USD" },
    });
  });

  it("totals tags per month for analytics", async () => {
    const january = {
      userId,
      from: new Date("2026-01-01"),
      to: new Date("2026-01-31"),
    };
    expect(
      (await getSpendingByTag(january)).map(({ name, total, count }) => ({
        name,
        total,
        count,
      })),
    ).toEqual([
      { name: "japan trip", total: 130, count: 2 },
      { name: "reimbursable", total: 100, count: 1 },
      { name: "food-out", total: 30, count: 1 },
    ]);
    expect(
      await getSpendingByTag({
        userId,
        from: new Date("2026-02-01"),
        to: new Date("2026-02-28"),
      }),
    ).toEqual([]);
    expect(
      (await getSpendingByTag({ ...january, baseCurrency: "ARS" }))[0].total,
    ).toBe(130000);
  });

  it("replaces tags on update, leaves them alone when omitted, clears with []", async () => {
    const renamedOnly = await updateExpenseForUser(userId, sushiId, {
      description: "Sushi dinner",
    });
    expect(names(renamedOnly)).toEqual(["food-out", "japan trip"]);

    const replaced = await updateExpenseForUser(userId, sushiId, {
      tags: ["food-out", "dinner"],
    });
    expect(names(replaced)).toEqual(["dinner", "food-out"]);

    const cleared = await updateExpenseForUser(userId, plainId, { tags: [] });
    expect(cleared.tags).toEqual([]);
  });

  it("adds and removes tags in bulk for the expenses a selector matches", async () => {
    const preview = await bulkUpdateExpensesForUser(userId, {
      selectors: { tags: ["dinner", "reimbursable"] },
      preview: true,
      data: { addTags: ["paid"] },
    });
    expect(preview.matched).toBe(2);
    // Preview doesn't write.
    expect(await listTagNamesForUser(userId)).not.toContain("paid");

    const result = await bulkUpdateExpensesForUser(userId, {
      selectors: { tags: ["dinner", "reimbursable"] },
      data: { addTags: ["paid", "dinner"], removeTags: ["reimbursable"] },
    });
    expect(result.changed).toBe(2);
    const byDescription = Object.fromEntries(
      (result.items ?? []).map((e) => [e.description, names(e)]),
    );
    expect(byDescription).toEqual({
      "Sushi dinner": ["dinner", "food-out", "paid"],
      Hotel: ["dinner", "japan trip", "paid"],
    });
  });

  it("exports tags and filters the export list by tag", async () => {
    const listed = await listExpensesForUser(userId, { tags: ["paid"] });
    expect(listed.map((e) => e.description).sort()).toEqual([
      "Hotel",
      "Sushi dinner",
    ]);
    expect(names(listed[0])).toContain("paid");
  });

  it("imports tags from CSV-style strings and arrays", async () => {
    const dry = await importExpensesForUser(userId, {
      dryRun: true,
      items: [
        { ...base, amount: 1, description: "Bad", tags: ["x".repeat(40)] },
      ],
    });
    expect(dry.errors).toHaveLength(1);

    const result = await importExpensesForUser(userId, {
      items: [
        { ...base, amount: 7, description: "Taxi", tags: "Japan Trip; paid" },
        { ...base, amount: 3, description: "Gum" },
      ],
    });
    expect(result.created).toBe(2);
    const taxi = (await listExpensesForUser(userId, { search: "Taxi" }))[0];
    expect(names(taxi)).toEqual(["japan trip", "paid"]);
  });

  it("renames a tag, and merges when renaming onto an existing one", async () => {
    const tags = await listTagsWithTotalsForUser(userId);
    const foodOut = tags.find((t) => t.name === "food-out")!;
    const renamed = await renameTagForUser(userId, foodOut.id, {
      name: "Eating Out",
    });
    expect(renamed).toMatchObject({
      merged: false,
      tag: { name: "eating out" },
    });

    const dinner = tags.find((t) => t.name === "dinner")!;
    const merged = await renameTagForUser(userId, dinner.id, {
      name: "#eating out",
    });
    expect(merged.merged).toBe(true);

    const after = await listTagsWithTotalsForUser(userId);
    expect(after.map((t) => t.name)).not.toContain("dinner");
    // Sushi had both tags (counted once), Hotel only had "dinner".
    expect(after.find((t) => t.name === "eating out")).toMatchObject({
      expenseCount: 2,
      total: 130,
    });
  });

  it("deleting a tag keeps its expenses", async () => {
    const tag = (await listTagsWithTotalsForUser(userId)).find(
      (t) => t.name === "paid",
    )!;
    await deleteTagForUser(userId, tag.id);
    expect(await listTagNamesForUser(userId)).not.toContain("paid");
    expect((await getExpenses({ userId })).total).toBe(5);
    await expect(deleteTagForUser(userId, tag.id)).rejects.toThrow(
      "Tag not found",
    );
  });

  it("deleting an expense removes its tag links but keeps the tag", async () => {
    await deleteExpenseForUser(userId, hotelId);
    const tags = await listTagsWithTotalsForUser(userId);
    expect(tags.find((t) => t.name === "japan trip")).toMatchObject({
      expenseCount: 1,
      total: 7,
    });
  });

  it("keeps tags isolated per user", async () => {
    const other = await createExpenseForUser(otherUserId, {
      ...base,
      categoryId: otherCategoryId,
      amount: 9,
      description: "Other",
      tags: ["japan trip"],
    });
    const otherTagId = (await listTagsWithTotalsForUser(otherUserId))[0].id;

    expect(names(other)).toEqual(["japan trip"]);
    expect(
      (await listTagsWithTotalsForUser(userId)).find(
        (t) => t.name === "japan trip",
      )?.expenseCount,
    ).toBe(1);
    expect(
      (await getExpenses({ userId, tags: ["japan trip"] })).expenses.map(
        (e) => e.description,
      ),
    ).toEqual(["Taxi"]);
    await expect(
      renameTagForUser(userId, otherTagId, { name: "stolen" }),
    ).rejects.toThrow("Tag not found");
    await expect(deleteTagForUser(userId, otherTagId)).rejects.toThrow(
      "Tag not found",
    );
  });
});
