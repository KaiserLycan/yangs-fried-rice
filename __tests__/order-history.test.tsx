import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OrderHistory } from "@/components/manage/orders/order-history";
import { getOrderStatusHistory } from "@/lib/actions/orders";

/** Limitations #9 / FINALE 9.7: the order itself says who cancelled it. */
vi.mock("@/lib/actions/orders", () => ({
  getOrderStatusHistory: vi.fn(),
}));

describe("OrderHistory", () => {
  it("loads when opened and names who made each change", async () => {
    vi.mocked(getOrderStatusHistory).mockResolvedValue({
      data: [
        { toStatus: "pending", changedAt: "2026-09-28T04:00:00Z", changedBy: "Customer", reason: null },
        { toStatus: "cancelled", changedAt: "2026-09-28T04:10:00Z", changedBy: "Jun Reyes", reason: "Out of stock" },
      ],
      error: null,
    });
    const { container } = render(<OrderHistory orderId="order-1" />);
    expect(getOrderStatusHistory).not.toHaveBeenCalled();

    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));

    expect(await screen.findByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText(/Jun Reyes · “Out of stock”/)).toBeInTheDocument();
    expect(getOrderStatusHistory).toHaveBeenCalledWith("order-1");
  });
});
