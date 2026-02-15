import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, userEvent } from "@/test-utils/react-testing";
import { ExpenseForm } from "../expense-form";
import type { Category } from "@/types";

// Mock browser APIs that vaul drawer library needs but jsdom doesn't support
beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  // Mock window.getComputedStyle to return valid transform value
  const originalGetComputedStyle = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((el, pseudo) => {
    const style = originalGetComputedStyle(el, pseudo);
    return {
      ...style,
      transform: style.transform || "none",
      getPropertyValue: (prop: string) => {
        if (prop === "transform") return style.transform || "none";
        return style.getPropertyValue(prop);
      },
    } as CSSStyleDeclaration;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock server actions
const mockDeleteExpense = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/actions/expenses", () => ({
  createExpense: vi.fn().mockResolvedValue(undefined),
  updateExpense: vi.fn().mockResolvedValue(undefined),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
}));

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
  {
    id: "cat-3",
    name: "Shopping",
    icon: "ShoppingCart",
    color: "#9B59B6",
  },
  {
    id: "cat-4",
    name: "Health",
    icon: "Heart",
    color: "#E74C3C",
  },
  {
    id: "cat-5",
    name: "Home",
    icon: "Home",
    color: "#2ECC71",
  },
  {
    id: "cat-6",
    name: "Bills",
    icon: "Zap",
    color: "#F39C12",
  },
  {
    id: "cat-7",
    name: "Education",
    icon: "GraduationCap",
    color: "#1ABC9C",
  },
  {
    id: "cat-8",
    name: "Entertainment",
    icon: "Film",
    color: "#3498DB",
  },
  {
    id: "cat-9",
    name: "Travel",
    icon: "Plane",
    color: "#E67E22",
  },
  {
    id: "cat-10",
    name: "Coffee",
    icon: "Coffee",
    color: "#795548",
  },
];

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("ExpenseForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders in create mode", () => {
    const { container } = render(<ExpenseForm categories={mockCategories} />);

    expect(container.textContent).toContain("Add Expense");
    expect(container.textContent).toContain("Save Expense");
  });

  it("renders in edit mode", () => {
    const { container } = render(
      <ExpenseForm
        categories={mockCategories}
        expense={{
          id: "exp-1",
          amount: 25.5,
          currency: "USD",
          description: "Lunch",
          date: "2025-01-15",
          categoryId: "cat-1",
        }}
      />,
    );

    expect(container.textContent).toContain("Edit Expense");
    expect(container.textContent).toContain("Update Expense");
  });

  it("pre-fills form in edit mode", () => {
    const { container } = render(
      <ExpenseForm
        categories={mockCategories}
        expense={{
          id: "exp-1",
          amount: 25.5,
          currency: "USD",
          description: "Lunch",
          date: "2025-01-15T00:00:00.000Z",
          categoryId: "cat-1",
          notes: "Some notes",
        }}
      />,
    );

    const amountInput = container.querySelector(
      'input[id="expense-amount"]',
    ) as HTMLInputElement;
    expect(amountInput?.value).toBe("25.50");

    const descInput = container.querySelector(
      'input[placeholder="Description"]',
    ) as HTMLInputElement;
    expect(descInput?.value).toBe("Lunch");

    const notesInput = container.querySelector(
      'input[placeholder="Notes (optional)"]',
    ) as HTMLInputElement;
    expect(notesInput?.value).toBe("Some notes");
  });

  it("validates amount input allows only decimal numbers", async () => {
    const user = userEvent.setup();
    const { container } = render(<ExpenseForm categories={mockCategories} />);

    const amountInput = container.querySelector('input[id="expense-amount"]')!;
    await user.type(amountInput, "12.34");
    expect((amountInput as HTMLInputElement).value).toBe("12.34");
  });

  it("save button is disabled when form is incomplete", () => {
    const { container } = render(<ExpenseForm categories={mockCategories} />);

    // Find the button containing "Save Expense"
    const buttons = container.querySelectorAll("button");
    const saveButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("Save Expense"),
    );
    expect(saveButton).toBeDefined();
    expect(saveButton!.disabled).toBe(true);
  });

  it("shows category picker trigger", () => {
    const { container } = render(<ExpenseForm categories={mockCategories} />);

    // Categories are now inside a drawer/popover, triggered by a button
    expect(container.textContent).toContain("Select category");
  });

  it("shows selected category name in picker trigger", () => {
    const { container } = render(
      <ExpenseForm
        categories={mockCategories}
        expense={{
          id: "exp-1",
          amount: 25.5,
          currency: "USD",
          description: "Lunch",
          date: "2025-01-15",
          categoryId: "cat-1",
        }}
      />,
    );

    // When a category is selected, its name should appear in the trigger
    expect(container.textContent).toContain("Food");
  });

  it("navigates back on close button click", async () => {
    const user = userEvent.setup();
    const { container } = render(<ExpenseForm categories={mockCategories} />);

    const closeButton = container.querySelector('button[aria-label="Close"]')!;
    await user.click(closeButton);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("does not show delete button in create mode", () => {
    const { container } = render(<ExpenseForm categories={mockCategories} />);

    const buttons = container.querySelectorAll("button");
    const deleteButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("Delete Expense"),
    );
    expect(deleteButton).toBeUndefined();
  });

  it("shows delete button in edit mode", () => {
    const { container } = render(
      <ExpenseForm
        categories={mockCategories}
        expense={{
          id: "exp-1",
          amount: 25.5,
          currency: "USD",
          description: "Lunch",
          date: "2025-01-15",
          categoryId: "cat-1",
        }}
      />,
    );

    const buttons = container.querySelectorAll("button");
    const deleteButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("Delete Expense"),
    );
    expect(deleteButton).toBeDefined();
  });

  it("calls deleteExpense and navigates to /expenses on delete", async () => {
    const user = userEvent.setup();
    const { container, baseElement } = render(
      <ExpenseForm
        categories={mockCategories}
        expense={{
          id: "exp-1",
          amount: 25.5,
          currency: "USD",
          description: "Lunch",
          date: "2025-01-15",
          categoryId: "cat-1",
        }}
      />,
    );

    // Click the delete button to open the confirmation drawer
    const buttons = container.querySelectorAll("button");
    const deleteButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("Delete Expense"),
    )!;
    await user.click(deleteButton);

    // Find and click the confirm button in the drawer (rendered in portal)
    const drawerButtons = baseElement.querySelectorAll(
      '[data-slot="drawer-content"] button',
    );
    const confirmButton = Array.from(drawerButtons).find((b) =>
      b.textContent?.includes("Delete"),
    )!;
    await user.click(confirmButton);

    expect(mockDeleteExpense).toHaveBeenCalledWith("exp-1");
    expect(mockRouter.push).toHaveBeenCalledWith("/expenses");
  });
});
