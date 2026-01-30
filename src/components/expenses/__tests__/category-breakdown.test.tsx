import { describe, it, expect } from "vitest";
import { render, screen } from "@/test-utils/react-testing";
import { CategoryBreakdown } from "../category-breakdown";
import { createMockExpense } from "@/test-utils/factories";

describe("CategoryBreakdown", () => {
  it("aggregates expenses by category", () => {
    const foodCategory = {
      id: "cat-1",
      name: "Food",
      icon: "UtensilsCrossed",
      color: "#E8855B",
      userId: "user-1",
    };
    const transportCategory = {
      id: "cat-2",
      name: "Transport",
      icon: "Car",
      color: "#5B8CE8",
      userId: "user-1",
    };

    const expenses = [
      createMockExpense({
        categoryId: "cat-1",
        category: foodCategory,
        baseAmount: 100,
      }),
      createMockExpense({
        categoryId: "cat-1",
        category: foodCategory,
        baseAmount: 50,
      }),
      createMockExpense({
        categoryId: "cat-2",
        category: transportCategory,
        baseAmount: 75,
      }),
    ];

    render(<CategoryBreakdown expenses={expenses} />);

    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
  });

  it("sorts categories by total descending", () => {
    const food = {
      id: "cat-1",
      name: "Food",
      icon: "UtensilsCrossed",
      color: "#E8855B",
      userId: "user-1",
    };
    const transport = {
      id: "cat-2",
      name: "Transport",
      icon: "Car",
      color: "#5B8CE8",
      userId: "user-1",
    };

    const expenses = [
      createMockExpense({
        categoryId: "cat-1",
        category: food,
        baseAmount: 50,
      }),
      createMockExpense({
        categoryId: "cat-2",
        category: transport,
        baseAmount: 200,
      }),
    ];

    const { container } = render(<CategoryBreakdown expenses={expenses} />);

    const categoryNames = container.querySelectorAll(".text-text-primary");
    expect(categoryNames[0]?.textContent).toBe("Transport");
    expect(categoryNames[1]?.textContent).toBe("Food");
  });

  it("renders bars with proportional widths", () => {
    const food = {
      id: "cat-1",
      name: "Food",
      icon: "UtensilsCrossed",
      color: "#E8855B",
      userId: "user-1",
    };
    const transport = {
      id: "cat-2",
      name: "Transport",
      icon: "Car",
      color: "#5B8CE8",
      userId: "user-1",
    };

    const expenses = [
      createMockExpense({
        categoryId: "cat-1",
        category: food,
        baseAmount: 100,
      }),
      createMockExpense({
        categoryId: "cat-2",
        category: transport,
        baseAmount: 50,
      }),
    ];

    const { container } = render(<CategoryBreakdown expenses={expenses} />);

    const bars = container.querySelectorAll(".h-full.rounded-full");
    // Food (100) should be 100%, Transport (50) should be 50%
    expect(bars[0]).toHaveStyle({ width: "100%" });
    expect(bars[1]).toHaveStyle({ width: "50%" });
  });

  it("renders empty when no expenses", () => {
    const { container } = render(<CategoryBreakdown expenses={[]} />);
    expect(container.querySelector(".space-y-3")?.children).toHaveLength(0);
  });
});
