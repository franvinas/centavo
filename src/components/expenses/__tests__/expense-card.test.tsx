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

  it("shows category icon with correct color", () => {
    const expense = createMockExpense({
      category: {
        id: "cat-1",
        name: "Food",
        icon: "UtensilsCrossed",
        color: "#E8855B",
      },
    });
    const { container } = render(<ExpenseCard expense={expense} />);

    const icon = container.querySelector('[data-slot="category-chip"] svg');
    expect(icon).toHaveStyle({ color: "#E8855B" });
  });

  it("shows the category emoji instead of an icon", () => {
    const expense = createMockExpense({
      category: { id: "c-emoji", name: "Pizza", icon: "🍕", color: "#C0392B" },
    });
    const { container } = render(<ExpenseCard expense={expense} />);
    const chip = container.querySelector<HTMLElement>(
      '[data-slot="category-chip"]',
    );
    expect(chip?.querySelector("[data-emoji-icon]")).toHaveTextContent("🍕");
    expect(chip?.querySelector("svg")).toBeNull();
  });
});
