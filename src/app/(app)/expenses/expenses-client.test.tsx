import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@/test-utils/react-testing";
import { ExpensesClient } from "./expenses-client";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: navigation.replace,
    push: navigation.push,
  }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock("@/components/expenses/expense-list", () => ({
  ExpenseList: () => null,
}));

function renderExpenses() {
  return render(
    <ExpensesClient
      expenses={[]}
      categories={[]}
      total={0}
      page={1}
      totalPages={1}
    />,
  );
}

describe("ExpensesClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigation.replace.mockReset();
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps rapid typing locally and updates the URL once", () => {
    const { container } = renderExpenses();
    const search = container.querySelector(
      'input[placeholder="Search expenses…"]',
    )!;

    fireEvent.change(search, { target: { value: "l" } });
    fireEvent.change(search, { target: { value: "lu" } });
    fireEvent.change(search, { target: { value: "lun" } });
    fireEvent.change(search, { target: { value: "lunc" } });
    fireEvent.change(search, { target: { value: "lunch" } });

    expect(search).toHaveValue("lunch");
    expect(navigation.replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));

    expect(navigation.replace).toHaveBeenCalledOnce();
    expect(navigation.replace).toHaveBeenCalledWith("/expenses?search=lunch");
  });

  it("clears every filter with one navigation", () => {
    navigation.searchParams = new URLSearchParams(
      "search=food&categoryId=cat-1&from=2026-07-01&to=2026-07-11",
    );
    const { container } = renderExpenses();
    const clearAll = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Clear filters",
    )!;

    fireEvent.click(clearAll);

    expect(navigation.replace).toHaveBeenCalledOnce();
    expect(navigation.replace).toHaveBeenCalledWith("/expenses");
  });
});
