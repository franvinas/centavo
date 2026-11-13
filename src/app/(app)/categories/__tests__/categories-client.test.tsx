import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, userEvent } from "@/test-utils/react-testing";
import { CategoriesClient } from "../categories-client";
import { createCategory, updateCategory } from "@/lib/actions/categories";
vi.mock("@/lib/actions/categories", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  reorderCategories: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());
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
    // The alert can render while the transition is still pending ("Saving...").
    await user.click(await screen.findByRole("button", { name: "Create" }));
    expect(createCategory).toHaveBeenCalledTimes(2);
  });
});

describe("custom emoji and color", () => {
  it("creates a category with a typed emoji and a custom hex color", async () => {
    vi.mocked(createCategory).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<CategoriesClient initialCategories={[]} />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByPlaceholderText("Category name"), "Pizza");

    await user.click(screen.getByRole("tab", { name: "Emoji" }));
    await user.type(screen.getByLabelText("Type or paste an emoji"), "abc");
    expect(screen.getByText(/not an emoji/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Type or paste an emoji"));
    await user.click(screen.getByLabelText("Type or paste an emoji"));
    await user.paste("🍕");
    expect(screen.getByTestId("category-preview")).toHaveTextContent("🍕");

    await user.click(screen.getByRole("button", { name: "Custom color" }));
    const hex = await screen.findByLabelText("Hex code");
    await user.clear(hex);
    await user.type(hex, "#12ab9f");

    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(createCategory).toHaveBeenCalledWith({
      name: "Pizza",
      color: "#12AB9F",
      icon: "🍕",
    });
  });

  it("opens an emoji category on the emoji tab and keeps a custom color selected", async () => {
    vi.mocked(updateCategory).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    const { container } = render(
      <CategoriesClient
        initialCategories={[
          { id: "c1", name: "Coffee", icon: "☕", color: "#123456" },
        ]}
      />,
    );
    expect(container.querySelector("[data-emoji-icon]")).toHaveTextContent(
      "☕",
    );

    await user.click(screen.getByRole("button", { name: "Edit Coffee" }));
    expect(screen.getByRole("tab", { name: "Emoji" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Custom color" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Select emoji 🍺" }));
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    await user.click(screen.getByRole("button", { name: "Update" }));
    expect(updateCategory).toHaveBeenCalledWith("c1", {
      name: "Coffee",
      color: "#123456",
      icon: "🍺",
    });
  });

  it("adjusts the color with the palette's keyboard controls", async () => {
    vi.mocked(createCategory).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<CategoriesClient initialCategories={[]} />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByPlaceholderText("Category name"), "X");
    await user.click(
      screen.getByRole("button", { name: "Select color #3498DB" }),
    );
    await user.click(screen.getByRole("button", { name: "Custom color" }));

    const hue = await screen.findByRole("slider", { name: "Hue" });
    hue.focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    const hex = screen.getByLabelText("Hex code") as HTMLInputElement;
    expect(hex.value).not.toBe("#3498DB");
    expect(hex.value).toMatch(/^#[0-9A-F]{6}$/);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ color: hex.value, icon: "UtensilsCrossed" }),
    );
  });

  it("replaces an invalid legacy icon when editing so the save succeeds", async () => {
    vi.mocked(updateCategory).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    const { container } = render(
      <CategoriesClient
        initialCategories={[
          { id: "c2", name: "Old", icon: "some-old-text", color: "#777777" },
        ]}
      />,
    );
    expect(container.querySelector("[data-emoji-icon]")).toBeNull();
    expect(container.textContent).not.toContain("some-old-text");

    await user.click(screen.getByRole("button", { name: "Edit Old" }));
    await user.click(screen.getByRole("button", { name: "Update" }));
    expect(updateCategory).toHaveBeenCalledWith("c2", {
      name: "Old",
      color: "#777777",
      icon: "MoreHorizontal",
    });
  });
});

describe("reordering", () => {
  it("shows categories in the given order, each with a reorder handle", () => {
    render(
      <CategoriesClient
        initialCategories={[
          { id: "c2", name: "Transport", icon: "Car", color: "#3498DB" },
          { id: "c1", name: "Food", icon: "🍕", color: "#E67E22" },
        ]}
      />,
    );
    const cards = screen.getAllByTestId("category-card");
    expect(cards.map((card) => card.textContent)).toEqual([
      "Transport",
      "🍕Food",
    ]);
    expect(
      screen.getByRole("button", { name: "Reorder Transport" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reorder Food" }),
    ).toBeInTheDocument();
  });
});
