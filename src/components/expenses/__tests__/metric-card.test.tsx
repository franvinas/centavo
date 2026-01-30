import { describe, it, expect } from "vitest";
import { render, screen } from "@/test-utils/react-testing";
import { MetricCard } from "../metric-card";

describe("MetricCard", () => {
  it("renders label and value", () => {
    render(<MetricCard label="Total Spent" value="$1,234.56" />);

    expect(screen.getByText("Total Spent")).toBeInTheDocument();
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });

  it("renders without trend", () => {
    render(<MetricCard label="Count" value="42" />);

    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders positive trend with down arrow (spending down is positive)", () => {
    render(
      <MetricCard
        label="Total"
        value="$100"
        trend={{ value: "12% less", positive: true }}
      />,
    );

    expect(screen.getByText("12% less")).toBeInTheDocument();
    expect(screen.getByText("12% less")).toHaveClass("text-status-positive");
  });

  it("renders negative trend with up arrow", () => {
    render(
      <MetricCard
        label="Total"
        value="$200"
        trend={{ value: "8% more", positive: false }}
      />,
    );

    expect(screen.getByText("8% more")).toBeInTheDocument();
    expect(screen.getByText("8% more")).toHaveClass("text-status-negative");
  });
});
