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
    const result = createCategorySchema.parse({
      ...validInput,
      icon: "UtensilsCrossed",
    });
    expect(result.icon).toBe("UtensilsCrossed");
  });

  it("accepts a single emoji as icon", () => {
    const result = createCategorySchema.parse({ ...validInput, icon: "🍕" });
    expect(result.icon).toBe("🍕");
  });

  it("accepts ZWJ and flag emojis as icon", () => {
    for (const icon of ["👩‍💻", "🇦🇷", "🏋️"]) {
      expect(
        createCategorySchema.safeParse({ ...validInput, icon }).success,
      ).toBe(true);
    }
  });

  it.each(["NotAnIcon", "abc", "🍔🍕", "", " 🍔"])(
    "rejects invalid icon %j",
    (icon) => {
      expect(
        createCategorySchema.safeParse({ ...validInput, icon }).success,
      ).toBe(false);
    },
  );

  it("accepts any valid custom hex color", () => {
    expect(
      createCategorySchema.safeParse({ ...validInput, color: "#a1b2c3" })
        .success,
    ).toBe(true);
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
    const result = createCategorySchema.safeParse({
      ...validInput,
      color: "red",
    });
    expect(result.success).toBe(false);
  });

  it("rejects hex color without hash", () => {
    const result = createCategorySchema.safeParse({
      ...validInput,
      color: "E8855B",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short hex color", () => {
    const result = createCategorySchema.safeParse({
      ...validInput,
      color: "#E88",
    });
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

  it("validates icon when provided", () => {
    expect(updateCategorySchema.safeParse({ icon: "🌮" }).success).toBe(true);
    expect(updateCategorySchema.safeParse({ icon: "taco" }).success).toBe(
      false,
    );
  });

  it("validates color when provided", () => {
    const result = updateCategorySchema.safeParse({ color: "invalid" });
    expect(result.success).toBe(false);
  });
});
