import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { renderValueLabel } from "@/components/manage/dashboard/sales-chart";

/**
 * Issue #106: "hide the data labels on mobile" — seven peso amounts across a
 * phone-width chart collide and read as one smear.
 *
 * The label renderer is tested on its own because the chart needs a measured
 * container, and jsdom gives every element zero width — recharts'
 * ResponsiveContainer then renders nothing at all.
 */
describe("sales chart value labels", () => {
  function labelFor(props: Record<string, unknown>) {
    const { container } = render(
      <svg>{renderValueLabel(props)}</svg>,
    );
    return container.querySelector("text");
  }

  it("is hidden at phone width and shown from md up", () => {
    const text = labelFor({ x: 10, y: 20, width: 40, value: "₱1,200" });
    expect(text).not.toBeNull();
    expect(text).toHaveClass("hidden");
    expect(text).toHaveClass("md:block");
  });

  it("still renders the amount, so it returns at wider widths", () => {
    expect(labelFor({ x: 0, y: 0, width: 20, value: "₱940" })).toHaveTextContent(
      "₱940",
    );
  });

  it("centres the label over its bar", () => {
    const text = labelFor({ x: 10, y: 50, width: 40, value: "₱1" });
    expect(text).toHaveAttribute("x", "30");
    expect(text).toHaveAttribute("text-anchor", "middle");
  });
});
