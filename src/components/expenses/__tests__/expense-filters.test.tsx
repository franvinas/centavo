import { describe, it, expect, vi } from "vitest";
import { render, userEvent } from "@/test-utils/react-testing";
import { ExpenseFilters } from "../expense-filters";
import type { Category } from "@/types";

const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Food",
    icon: "UtensilsCrossed",
    color: "#E8855B",
  },
  {
    id: "cat-2",
    name: "Transport",
    icon: "Car",
    color: "#5B8CE8",
  },
];

function renderFilters(overrides = {}) {
  const props = {
    search: "",
    onSearchChange: vi.fn(),
    categoryId: "",
    onCategoryChange: vi.fn(),
    dateFrom: "",
    dateTo: "",
    onDateRangeChange: vi.fn(),
    onClearAll: vi.fn(),
    categories: mockCategories,
    ...overrides,
  };
  return { ...render(<ExpenseFilters {...props} />), props };
}

describe("ExpenseFilters", () => {
  it("renders search input", () => {
    const { container } = renderFilters();
    const search = container.querySelector(
      'input[placeholder="Search expenses…"]',
    );
    expect(search).toBeInTheDocument();
  });

  it("calls onSearchChange when typing", async () => {
    const user = userEvent.setup();
    const { container, props } = renderFilters();

    const search = container.querySelector(
      'input[placeholder="Search expenses…"]',
    )!;
    await user.type(search, "l");
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("renders category dropdown with options", () => {
    const { container } = renderFilters();

    const select = container.querySelector("select")!;
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("All categories");
    expect(options[1]).toHaveTextContent("Food");
    expect(options[2]).toHaveTextContent("Transport");
  });

  it("calls onCategoryChange when selecting category", async () => {
    const user = userEvent.setup();
    const { container, props } = renderFilters();

    const select = container.querySelector("select")!;
    await user.selectOptions(select, "cat-1");
    expect(props.onCategoryChange).toHaveBeenCalledWith("cat-1");
  });

  it("renders date range picker button", () => {
    const { container } = renderFilters();
    expect(container.textContent).toContain("Date range");
  });

  it("shows formatted date range when values are set", () => {
    const { container } = renderFilters({
      dateFrom: "2025-01-15",
      dateTo: "2025-02-20",
    });
    expect(container.textContent).toContain("Jan 15");
    expect(container.textContent).toContain("Feb 20");
  });

  it("shows clear filters button when a filter is active", () => {
    const { container } = renderFilters({ search: "food" });
    expect(container.textContent).toContain("Clear filters");
  });

  it("does not show clear filters button when no filter is active", () => {
    const { container } = renderFilters();
    expect(container.textContent).not.toContain("Clear filters");
  });

  it("clears all filters atomically", async () => {
    const user = userEvent.setup();
    const { container, props } = renderFilters({
      search: "food",
      categoryId: "cat-1",
      dateFrom: "2025-01-01",
      dateTo: "2025-01-31",
    });

    const clearButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Clear filters",
    )!;
    await user.click(clearButton);

    expect(props.onClearAll).toHaveBeenCalledOnce();
    expect(props.onSearchChange).not.toHaveBeenCalled();
    expect(props.onCategoryChange).not.toHaveBeenCalled();
    expect(props.onDateRangeChange).not.toHaveBeenCalled();
  });
});
