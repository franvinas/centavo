import { describe, it, expect } from "vitest";
import { createExpenseSchema, updateExpenseSchema } from "../expense";

describe("createExpenseSchema", () => {
  const validInput = {
    amount: 25.5,
    currency: "usd",
    description: "Lunch",
    categoryId: "cat-1",
    date: "2025-01-15",
  };

  it("accepts valid input", () => {
    const result = createExpenseSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("uppercases currency code", () => {
    const result = createExpenseSchema.parse(validInput);
    expect(result.currency).toBe("USD");
  });

  it("accepts optional notes", () => {
    const result = createExpenseSchema.parse({ ...validInput, notes: "Extra info" });
    expect(result.notes).toBe("Extra info");
  });

  it("rejects zero amount", () => {
    const result = createExpenseSchema.safeParse({ ...validInput, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = createExpenseSchema.safeParse({ ...validInput, amount: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid currency length", () => {
    const result = createExpenseSchema.safeParse({ ...validInput, currency: "US" });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = createExpenseSchema.safeParse({ ...validInput, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects description over 200 chars", () => {
    const result = createExpenseSchema.safeParse({
      ...validInput,
      description: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty categoryId", () => {
    const result = createExpenseSchema.safeParse({ ...validInput, categoryId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = createExpenseSchema.safeParse({ ...validInput, date: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 500 chars", () => {
    const result = createExpenseSchema.safeParse({
      ...validInput,
      notes: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateExpenseSchema", () => {
  it("accepts partial input", () => {
    const result = updateExpenseSchema.safeParse({ description: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateExpenseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates amount when provided", () => {
    const result = updateExpenseSchema.safeParse({ amount: -1 });
    expect(result.success).toBe(false);
  });

  it("uppercases currency when provided", () => {
    const result = updateExpenseSchema.parse({ currency: "eur" });
    expect(result.currency).toBe("EUR");
  });
});
