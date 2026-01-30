import { describe, it, expect } from "vitest";
import { createCategorySchema, updateCategorySchema } from "../category";

describe("createCategorySchema", () => {
  const validInput = {
    name: "Food",
    color: "#E8855B",
  };

  it("accepts valid input", () => {
    const result = createCategorySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts optional icon", () => {
    const result = createCategorySchema.parse({ ...validInput, icon: "UtensilsCrossed" });
    expect(result.icon).toBe("UtensilsCrossed");
  });

  it("rejects empty name", () => {
    const result = createCategorySchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 50 chars", () => {
    const result = createCategorySchema.safeParse({
      ...validInput,
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    const result = createCategorySchema.safeParse({ ...validInput, color: "red" });
    expect(result.success).toBe(false);
  });

  it("rejects hex color without hash", () => {
    const result = createCategorySchema.safeParse({ ...validInput, color: "E8855B" });
    expect(result.success).toBe(false);
  });

  it("rejects short hex color", () => {
    const result = createCategorySchema.safeParse({ ...validInput, color: "#E88" });
    expect(result.success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("accepts partial input", () => {
    const result = updateCategorySchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateCategorySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates color when provided", () => {
    const result = updateCategorySchema.safeParse({ color: "invalid" });
    expect(result.success).toBe(false);
  });
});
