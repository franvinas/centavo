import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test-utils/react-testing";
import { ExpenseFilters } from "../expense-filters";
import type { Category } from "@/types";

const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Food",
    icon: "UtensilsCrossed",
    color: "#E8855B",
    userId: "user-1",
  },
  {
    id: "cat-2",
    name: "Transport",
    icon: "Car",
    color: "#5B8CE8",
    userId: "user-1",
  },
];

function renderFilters(overrides = {}) {
  const props = {
    search: "",
    onSearchChange: vi.fn(),
    categoryId: "",
    onCategoryChange: vi.fn(),
    dateFrom: "",
    onDateFromChange: vi.fn(),
    dateTo: "",
    onDateToChange: vi.fn(),
    categories: mockCategories,
    ...overrides,
  };
  return { ...render(<ExpenseFilters {...props} />), props };
}

describe("ExpenseFilters", () => {
  it("renders search input", () => {
    const { container } = renderFilters();
    const search = container.querySelector(
      'input[placeholder="Search expenses..."]',
    );
    expect(search).toBeInTheDocument();
  });

  it("calls onSearchChange when typing", async () => {
    const user = userEvent.setup();
    const { container, props } = renderFilters();

    const search = container.querySelector(
      'input[placeholder="Search expenses..."]',
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

  it("renders date inputs", () => {
    const { container } = renderFilters();
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs).toHaveLength(2);
  });

  it("calls date change handlers", async () => {
    const user = userEvent.setup();
    const { container, props } = renderFilters();

    const dateInputs = container.querySelectorAll('input[type="date"]');
    await user.type(dateInputs[0]!, "2025-01-01");
    expect(props.onDateFromChange).toHaveBeenCalled();
  });
});
