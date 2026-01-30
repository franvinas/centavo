import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test-utils/react-testing";
import { CategoryChip } from "../category-chip";
import type { Category } from "@/types";

const mockCategory: Category = {
  id: "cat-1",
  name: "Food",
  icon: "UtensilsCrossed",
  color: "#E8855B",
  userId: "user-1",
};

describe("CategoryChip", () => {
  it("renders category name", () => {
    render(
      <CategoryChip
        category={mockCategory}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("applies selected styling", () => {
    const { container } = render(
      <CategoryChip
        category={mockCategory}
        selected={true}
        onSelect={vi.fn()}
      />,
    );

    const button = container.querySelector("button")!;
    expect(button.className).toContain("border-current");
  });

  it("applies unselected styling", () => {
    const { container } = render(
      <CategoryChip
        category={mockCategory}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    const button = container.querySelector("button")!;
    expect(button.className).toContain("border-border-subtle");
  });

  it("calls onSelect with category id on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <CategoryChip
        category={mockCategory}
        selected={false}
        onSelect={onSelect}
      />,
    );

    const button = container.querySelector("button")!;
    await user.click(button);
    expect(onSelect).toHaveBeenCalledWith("cat-1");
  });
});
