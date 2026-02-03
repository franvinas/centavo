import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SummaryCards } from "@/components/analytics/summary-cards";

describe("SummaryCards", () => {
  it("renders three metric cards with correct values", () => {
    const { container } = render(
      <SummaryCards
        summary={{
          totalSpent: 1234.56,
          transactionCount: 42,
          dailyAverage: 41.15,
        }}
        baseCurrency="USD"
      />,
    );

    const cards = container.querySelectorAll(".rounded-lg");
    expect(cards).toHaveLength(3);

    expect(container.textContent).toContain("$1,234.56");
    expect(container.textContent).toContain("42");
    expect(container.textContent).toContain("$41.15");
  });

  it("renders labels correctly", () => {
    const { container } = render(
      <SummaryCards
        summary={{
          totalSpent: 0,
          transactionCount: 0,
          dailyAverage: 0,
        }}
        baseCurrency="USD"
      />,
    );

    expect(container.textContent).toContain("Total Spent");
    expect(container.textContent).toContain("Transactions");
    expect(container.textContent).toContain("Daily Average");
  });

  it("formats with correct currency", () => {
    const { container } = render(
      <SummaryCards
        summary={{
          totalSpent: 100,
          transactionCount: 1,
          dailyAverage: 100,
        }}
        baseCurrency="EUR"
      />,
    );

    // EUR formatting
    expect(container.textContent).toContain("€100.00");
  });
});
