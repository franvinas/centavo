import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, userEvent } from "@/test-utils/react-testing";
import { CategoriesClient } from "../categories-client";
import { createCategory } from "@/lib/actions/categories";
vi.mock("@/lib/actions/categories", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
describe("category form recovery", () => {
  it("keeps the dialog and user input after a duplicate or network error", async () => {
    vi.mocked(createCategory).mockRejectedValueOnce(
      new Error("private database details"),
    );
    const user = userEvent.setup();
    render(<CategoriesClient initialCategories={[]} />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByPlaceholderText("Category name"), "Food");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Check that the name is unique",
    );
    expect(
      screen.queryByText("private database details"),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Category name")).toHaveValue("Food");
    vi.mocked(createCategory).mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(createCategory).toHaveBeenCalledTimes(2);
  });
});
