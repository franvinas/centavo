import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test-utils/react-testing";
import { ExpenseCard } from "../expense-card";
import { createMockExpense } from "@/test-utils/factories";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ExpenseCard", () => {
  it("renders expense description", () => {
    const expense = createMockExpense({ description: "Coffee at Starbucks" });
    render(<ExpenseCard expense={expense} />);

    expect(screen.getByText("Coffee at Starbucks")).toBeInTheDocument();
  });

  it("renders amount with currency", () => {
    const expense = createMockExpense({ amount: 25.5, currency: "USD" });
    const { container } = render(<ExpenseCard expense={expense} />);

    expect(container.textContent).toContain("$25.50");
  });

  it("renders category name", () => {
    const expense = createMockExpense({
      category: {
        id: "cat-1",
        name: "Food",
        icon: "UtensilsCrossed",
        color: "#E8855B",
      },
    });
    const { container } = render(<ExpenseCard expense={expense} />);

    expect(container.textContent).toContain("Food");
  });

  it("links to expense detail page", () => {
    const expense = createMockExpense({ id: "exp-123" });
    const { container } = render(<ExpenseCard expense={expense} />);

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/expenses/exp-123");
  });

  it("shows category dot with correct color", () => {
    const expense = createMockExpense({
      category: {
        id: "cat-1",
        name: "Food",
        icon: "UtensilsCrossed",
        color: "#E8855B",
      },
    });
    const { container } = render(<ExpenseCard expense={expense} />);

    const dot = container.querySelector(".rounded-full");
    expect(dot).toHaveStyle({ backgroundColor: "#E8855B" });
  });
});
