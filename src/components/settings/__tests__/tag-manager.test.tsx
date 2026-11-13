import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  userEvent,
  waitFor,
} from "@/test-utils/react-testing";
import { TagManager, type TagSummary } from "../tag-manager";

const renameTag = vi.fn();
const deleteTag = vi.fn();
vi.mock("@/lib/actions/tags", () => ({
  renameTag: (...args: unknown[]) => renameTag(...args),
  deleteTag: (...args: unknown[]) => deleteTag(...args),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  renameTag.mockReset().mockResolvedValue({ name: "x", merged: false });
  deleteTag.mockReset().mockResolvedValue(undefined);
  refresh.mockReset();
});
afterEach(cleanup);

const tags: TagSummary[] = [
  {
    id: "t1",
    name: "japan trip",
    expenseCount: 2,
    total: 130,
    currency: "USD",
    pendingConversionCount: 0,
  },
  {
    id: "t2",
    name: "work",
    expenseCount: 1,
    total: 12.5,
    currency: "USD",
    pendingConversionCount: 1,
  },
];

describe("TagManager", () => {
  it("shows an empty state", () => {
    const { container } = render(<TagManager tags={[]} />);
    expect(container.textContent).toContain("haven't used any tags");
  });

  it("lists each tag with its count, total and a link to its expenses", () => {
    const { container } = render(<TagManager tags={tags} />);
    const rows = container.querySelectorAll('[data-slot="tag-list"] > li');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("#japan trip");
    expect(rows[0].textContent).toContain("2 expenses · $130.00");
    expect(rows[1].textContent).toContain("1 pending conversion");
    expect(rows[0].querySelector("a")?.getAttribute("href")).toBe(
      "/expenses?tags=japan%20trip",
    );
  });

  it("renames a tag with a normalized name", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagManager tags={tags} />);
    await user.click(
      container.querySelector('button[aria-label="Rename japan trip"]')!,
    );
    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="Tag name"]',
    )!;
    await user.clear(input);
    await user.type(input, "  #Japón 2026{Enter}");
    await waitFor(() =>
      expect(renameTag).toHaveBeenCalledWith("t1", "japón 2026"),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("warns before merging into an existing tag", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagManager tags={tags} />);
    await user.click(
      container.querySelector('button[aria-label="Rename work"]')!,
    );
    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="Tag name"]',
    )!;
    await user.clear(input);
    await user.type(input, "Japan Trip");
    expect(container.textContent).toContain(
      "#japan trip already exists. Saving merges both tags.",
    );
  });

  it("cancels editing without saving", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagManager tags={tags} />);
    await user.click(
      container.querySelector('button[aria-label="Rename work"]')!,
    );
    await user.click(container.querySelector('button[aria-label="Cancel"]')!);
    expect(container.querySelector('input[aria-label="Tag name"]')).toBeNull();
    expect(renameTag).not.toHaveBeenCalled();
  });

  it("shows an error when the rename fails", async () => {
    renameTag.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    const { container } = render(<TagManager tags={tags} />);
    await user.click(
      container.querySelector('button[aria-label="Rename work"]')!,
    );
    await user.type(
      container.querySelector('input[aria-label="Tag name"]')!,
      "x{Enter}",
    );
    await waitFor(() =>
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(
        "Unable to update the tag. Try again.",
      ),
    );
  });

  it("confirms before deleting a tag", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagManager tags={tags} />);
    await user.click(
      container.querySelector('button[aria-label="Delete japan trip"]')!,
    );
    await waitFor(() =>
      expect(document.body.textContent).toContain(
        "Delete the tag #japan trip?",
      ),
    );
    expect(document.body.textContent).toContain(
      "2 expenses keep their data and just lose this tag.",
    );
    expect(deleteTag).not.toHaveBeenCalled();
  });
});
