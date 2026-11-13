import { describe, expect, it, vi } from "vitest";
import { render } from "@/test-utils/react-testing";
import { ExpenseCard } from "../expense-card";
import type { Expense } from "@/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const expense: Expense = {
  id: "exp-1",
  amount: 30,
  currency: "USD",
  baseAmount: 30,
  baseCurrency: "USD",
  description: "Sushi",
  date: "2026-01-10T00:00:00.000Z",
  categoryId: "cat-1",
  category: {
    id: "cat-1",
    name: "Food",
    icon: "UtensilsCrossed",
    color: "#E8855B",
  },
};

describe("ExpenseCard tags", () => {
  it("renders no chips for an untagged expense", () => {
    const { container } = render(<ExpenseCard expense={expense} />);
    expect(container.querySelector('[data-slot="tag-chips"]')).toBeNull();
  });

  it("links each chip to the expenses filtered by that tag, without nesting links", () => {
    const { container } = render(
      <ExpenseCard expense={{ ...expense, tags: ["japan trip", "work"] }} />,
    );
    const chips = container.querySelectorAll('[data-slot="tag-chips"] a');
    expect(Array.from(chips).map((a) => a.getAttribute("href"))).toEqual([
      "/expenses?tags=japan%20trip",
      "/expenses?tags=work",
    ]);
    expect(container.querySelector("a a")).toBeNull();
    expect(container.querySelector('a[href="/expenses/exp-1"]')).not.toBeNull();
  });

  it("shows two chips and a +N counter for the rest", () => {
    const { container } = render(
      <ExpenseCard expense={{ ...expense, tags: ["a", "b", "c", "d"] }} />,
    );
    expect(
      container.querySelectorAll('[data-slot="tag-chips"] a'),
    ).toHaveLength(2);
    expect(
      container.querySelector('[data-slot="tag-chips"]')?.textContent,
    ).toContain("+2");
  });
});
