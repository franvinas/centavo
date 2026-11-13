import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, userEvent } from "@/test-utils/react-testing";
import { TagInput } from "../tag-input";

function Harness({
  initial = [],
  suggestions = ["food", "japan trip", "work"],
  onChange = vi.fn(),
}: {
  initial?: string[];
  suggestions?: string[];
  onChange?: (tags: string[]) => void;
}) {
  const [tags, setTags] = useState(initial);
  return (
    <TagInput
      value={tags}
      suggestions={suggestions}
      onChange={(next) => {
        setTags(next);
        onChange(next);
      }}
    />
  );
}

function chips(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-slot="tag-chip"]')).map(
    (chip) => chip.textContent?.replace("#", ""),
  );
}

function input(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('input[aria-label="Tags"]')!;
}

describe("TagInput", () => {
  it("adds a normalized tag on Enter and on comma", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness suggestions={[]} />);

    await user.type(input(container), "  #Japan Trip {Enter}");
    await user.type(input(container), "Work,");
    expect(chips(container)).toEqual(["japan trip", "work"]);
    expect(input(container).value).toBe("");
  });

  it("adds exactly what was typed even when a longer suggestion matches", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness suggestions={["food-out"]} />);

    await user.type(input(container), "food{Enter}");
    expect(chips(container)).toEqual(["food"]);
  });

  it("splits pasted lists and ignores duplicates", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initial={["work"]} />);

    await user.click(input(container));
    await user.paste("trip; WORK, trip, home");
    expect(chips(container)).toEqual(["work", "trip", "home"]);
  });

  it("suggests existing tags that aren't selected and adds them on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initial={["food"]} />);

    await user.type(input(container), "j");
    const options = Array.from(document.querySelectorAll('[role="option"]'));
    expect(options.map((o) => o.textContent)).toEqual([
      "Add tag “j”",
      "japan trip",
    ]);
    await user.click(options[1]);
    expect(chips(container)).toEqual(["food", "japan trip"]);
  });

  it("navigates suggestions with the arrow keys", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.type(input(container), "o{ArrowDown}{Enter}");
    // "o" (new) is first, then "food", "work".
    expect(chips(container)).toEqual(["food"]);
  });

  it("removes chips with their button and with Backspace", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initial={["a", "b", "c"]} />);

    await user.click(
      container.querySelector('button[aria-label="Remove tag b"]')!,
    );
    expect(chips(container)).toEqual(["a", "c"]);
    await user.type(input(container), "{Backspace}");
    expect(chips(container)).toEqual(["a"]);
  });

  it("commits a pending draft on blur", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.type(input(container), "pending");
    await user.tab();
    expect(chips(container)).toEqual(["pending"]);
  });

  it("stops accepting tags at the limit", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => `t${i}`);
    const { container } = render(<Harness initial={ten} />);

    expect(input(container)).toBeDisabled();
    expect(input(container).placeholder).toBe("Up to 10 tags per expense");
  });
});
