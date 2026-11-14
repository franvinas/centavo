import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { FitAmount } from "../fit-amount";

// jsdom has no layout: fake the box width and the text's natural width.
let boxWidth = 0;
let textWidth = 0;

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
    () => boxWidth,
  );
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      // The text scales with its font size, like a real browser.
      const size = this.style.fontSize;
      const scale = size.endsWith("em") ? parseFloat(size) : 1;
      return textWidth * scale;
    },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function textOf(container: HTMLElement) {
  return container.querySelector("span > span") as HTMLElement;
}

describe("FitAmount", () => {
  it("keeps the full size when the amount fits", () => {
    boxWidth = 300;
    textWidth = 200;
    const { container } = render(<FitAmount>ARS 1,600,000.50</FitAmount>);

    const text = textOf(container);
    expect(text).toHaveTextContent("ARS 1,600,000.50");
    expect(text.style.fontSize).toBe("");
    expect(text).toHaveClass("whitespace-nowrap");
  });

  it("shrinks the font just enough to fit the available width", () => {
    boxWidth = 150;
    textWidth = 200;
    const { container } = render(<FitAmount>ARS 23,296,145,876.17</FitAmount>);

    const text = textOf(container);
    expect(text.style.fontSize).toBe("0.75em");
    expect(text).toHaveClass("whitespace-nowrap");
  });

  it("wraps instead of clipping when even the smallest size is too wide", () => {
    boxWidth = 50;
    textWidth = 200;
    const { container } = render(
      <FitAmount minScale={0.5}>ARS 23,296,145,876.17</FitAmount>,
    );

    const text = textOf(container);
    expect(text.style.fontSize).toBe("0.5em");
    expect(text).toHaveClass("whitespace-normal");
  });
});
