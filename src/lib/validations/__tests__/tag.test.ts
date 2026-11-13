import { describe, expect, it } from "vitest";
import {
  normalizeTagName,
  parseTagFilter,
  renameTagSchema,
  tagListSchema,
} from "../tag";
import { createExpenseSchema, updateExpenseSchema } from "../expense";
import { bulkExpenseUpdateSchema } from "../expense-bulk";

describe("normalizeTagName", () => {
  it("trims, lowercases, strips a leading # and collapses whitespace", () => {
    expect(normalizeTagName("  #Viaje   Japón ")).toBe("viaje japón");
    expect(normalizeTagName("##Work")).toBe("work");
  });
});

describe("tagListSchema", () => {
  it("normalizes and de-duplicates arrays, keeping first-seen order", () => {
    expect(tagListSchema.parse(["Trip", "#trip", "work", " WORK "])).toEqual([
      "trip",
      "work",
    ]);
  });

  it("accepts a comma or semicolon separated string (CSV cells)", () => {
    expect(tagListSchema.parse("trip; work, , #home")).toEqual([
      "trip",
      "work",
      "home",
    ]);
  });

  it("rejects empty tags inside arrays and overly long tags", () => {
    expect(tagListSchema.safeParse(["  "]).success).toBe(false);
    expect(tagListSchema.safeParse(["x".repeat(31)]).success).toBe(false);
    expect(tagListSchema.safeParse(["x".repeat(30)]).success).toBe(true);
  });

  it("allows at most 10 distinct tags", () => {
    const ten = Array.from({ length: 10 }, (_, i) => `t${i}`);
    expect(tagListSchema.safeParse(ten).success).toBe(true);
    expect(tagListSchema.safeParse([...ten, "t0"]).success).toBe(true);
    expect(tagListSchema.safeParse([...ten, "t10"]).success).toBe(false);
  });
});

describe("expense schemas", () => {
  const base = {
    amount: 10,
    currency: "usd",
    description: "Lunch",
    categoryId: "cat-1",
    date: "2026-01-05",
  };

  it("keeps tags optional on create", () => {
    expect(createExpenseSchema.parse(base).tags).toBeUndefined();
    expect(createExpenseSchema.parse({ ...base, tags: ["A"] }).tags).toEqual([
      "a",
    ]);
  });

  it("lets updates clear tags with an empty list", () => {
    expect(updateExpenseSchema.parse({ tags: [] }).tags).toEqual([]);
  });
});

describe("bulkExpenseUpdateSchema", () => {
  it("accepts a tag selector and add/remove tag changes alone", () => {
    const parsed = bulkExpenseUpdateSchema.parse({
      selectors: { tags: ["Trip"] },
      data: { addTags: ["paid"], removeTags: ["pending"] },
    });
    expect(parsed.selectors.tags).toEqual(["trip"]);
    expect(parsed.data.addTags).toEqual(["paid"]);
  });

  it("rejects adding and removing the same tag", () => {
    expect(
      bulkExpenseUpdateSchema.safeParse({
        selectors: { ids: ["exp-1"] },
        data: { addTags: ["x"], removeTags: ["#X"] },
      }).success,
    ).toBe(false);
  });

  it("still requires at least one change", () => {
    expect(
      bulkExpenseUpdateSchema.safeParse({
        selectors: { ids: ["exp-1"] },
        data: { addTags: [] },
      }).success,
    ).toBe(false);
  });
});

describe("parseTagFilter", () => {
  it("returns undefined for empty input", () => {
    expect(parseTagFilter(undefined)).toBeUndefined();
    expect(parseTagFilter("")).toBeUndefined();
    expect(parseTagFilter([])).toBeUndefined();
  });

  it("merges repeated params and comma lists", () => {
    expect(parseTagFilter(["Trip,work", "trip"])).toEqual(["trip", "work"]);
  });
});

describe("renameTagSchema", () => {
  it("normalizes the new name", () => {
    expect(renameTagSchema.parse({ name: " #New Name " }).name).toBe(
      "new name",
    );
    expect(renameTagSchema.safeParse({ name: "#" }).success).toBe(false);
  });
});
