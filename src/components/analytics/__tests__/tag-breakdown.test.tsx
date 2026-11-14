import { describe, expect, it } from "vitest";
import { render } from "@/test-utils/react-testing";
import { TagBreakdown } from "@/components/analytics/tag-breakdown";

const data = [
  { tagId: "t1", name: "japan trip", total: 130, count: 2 },
  {
    tagId: "t2",
    name: "food",
    total: 30,
    count: 1,
    pendingConversionCount: 1,
  },
];

describe("TagBreakdown", () => {
  it("lists each tag with its total and links to the filtered period", () => {
    const { container } = render(
      <TagBreakdown
        data={data}
        baseCurrency="USD"
        from="2026-10-01"
        to="2026-10-31"
      />,
    );

    const rows = container.querySelectorAll('[data-slot="tag-breakdown"] li');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("#japan trip");
    expect(rows[0].textContent).toContain("$130.00");
    expect(rows[0].textContent).toContain("2 transactions");
    expect(rows[1].textContent).toContain("$30.00");
    expect(rows[1].querySelector('[role="status"]')).not.toBeNull();

    const link = rows[0].querySelector("a");
    expect(link?.getAttribute("href")).toBe(
      "/expenses?tags=japan+trip&from=2026-10-01&to=2026-10-31",
    );
    expect(container.textContent).toContain("don't add up");
  });

  it("shows an empty state when nothing is tagged", () => {
    const { container } = render(
      <TagBreakdown data={[]} baseCurrency="USD" from="a" to="b" />,
    );
    expect(container.querySelector('[data-slot="tag-breakdown"]')).toBeNull();
    expect(container.textContent).toContain("No tagged expenses");
  });

  it("omits the overlap hint for a single tag", () => {
    const { container } = render(
      <TagBreakdown
        data={[data[0]]}
        baseCurrency="USD"
        from="2026-10-01"
        to="2026-10-31"
      />,
    );
    expect(container.textContent).not.toContain("don't add up");
  });
});
