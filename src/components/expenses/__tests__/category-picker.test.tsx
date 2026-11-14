import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@/test-utils/react-testing";
import { fireEvent } from "@testing-library/react";
import { CategoryPicker } from "../category-picker";
import type { Category } from "@/types";

beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const categories = [
  { id: "cat-1", name: "Food", color: "#E67E22", icon: "UtensilsCrossed" },
  { id: "cat-2", name: "Taxi", color: "#3498DB", icon: "🚕" },
] as Category[];

describe("CategoryPicker (mobile drawer)", () => {
  it("blurs the focused field when the drawer opens so the iOS keyboard closes", () => {
    const { container } = render(
      <>
        <input data-testid="description" />
        <CategoryPicker
          categories={categories}
          selectedId=""
          onSelect={vi.fn()}
        />
      </>,
    );

    const input = container.querySelector<HTMLInputElement>(
      "[data-testid=description]",
    )!;
    input.focus();
    expect(document.activeElement).toBe(input);

    const trigger = container.querySelector<HTMLButtonElement>(
      ".md\\:hidden [data-slot=drawer-trigger]",
    )!;
    fireEvent.click(trigger);

    expect(document.activeElement).not.toBe(input);
    expect(document.querySelector("[data-slot=drawer-content]")).not.toBeNull();
  });
});
