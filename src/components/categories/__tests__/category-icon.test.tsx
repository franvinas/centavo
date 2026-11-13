import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@/test-utils/react-testing";

import {
  CategoryIcon,
  categoryTileStyle,
} from "@/components/categories/category-icon";

afterEach(() => cleanup());

describe("categoryTileStyle", () => {
  it("uses a light tint for built-in icons", () => {
    expect(categoryTileStyle("Coffee", "#3D8A5A")).toEqual({
      backgroundColor: "#3D8A5A1F",
    });
  });

  it("uses a stronger tint for emojis", () => {
    expect(categoryTileStyle("😎", "#3D8A5A")).toEqual({
      backgroundColor: "#3D8A5A33",
    });
  });
});

describe("CategoryIcon", () => {
  it("renders emojis as text", () => {
    const { container } = render(<CategoryIcon icon="😎" color="#3D8A5A" />);
    expect(container.querySelector("[data-emoji-icon]")).toHaveTextContent(
      "😎",
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders built-in icons as svg tinted with the category color", () => {
    const { container } = render(
      <CategoryIcon icon="Coffee" color="#3D8A5A" />,
    );
    expect(container.querySelector("[data-emoji-icon]")).toBeNull();
    expect(container.querySelector("svg")).toHaveStyle({ color: "#3D8A5A" });
  });

  it("falls back to a generic icon for unknown legacy values", () => {
    const { container } = render(
      <CategoryIcon icon="some-old-text" color="#777777" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).not.toContain("some-old-text");
  });
});
