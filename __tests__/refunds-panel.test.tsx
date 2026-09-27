import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RefundRow } from "@/lib/actions/refunds";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const markRefundedByHand = vi.fn();
vi.mock("@/lib/actions/refunds", () => ({
  markRefundedByHand: (id: string) => markRefundedByHand(id),
}));

import { RefundsPanel } from "@/components/manage/dashboard/refunds-panel";

function refund(over: Partial<RefundRow> = {}): RefundRow {
  return {
    transactionId: "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
    orderId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    orderNumber: "0AE7",
    amount: 250,
    status: "refund_pending",
    error: null,
    refundedAt: null,
    cancelledAt: null,
    ...over,
  };
}

beforeEach(() => {
  refresh.mockClear();
  markRefundedByHand.mockReset();
});

describe("RefundsPanel (issue #115)", () => {
  it("renders nothing when there are no refunds", () => {
    const { container } = render(<RefundsPanel refunds={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists refunds in flight without a manual action", () => {
    render(<RefundsPanel refunds={[refund()]} />);

    expect(screen.getByText(/Order #0AE7 · ₱250\.00/)).toBeInTheDocument();
    expect(screen.getByText("Sending")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark refunded" })).not.toBeInTheDocument();
  });

  it("shows why a refund failed and lets a manager mark it done", async () => {
    markRefundedByHand.mockResolvedValue({ data: true, error: null });
    render(
      <RefundsPanel
        refunds={[refund({ status: "refund_failed", error: "PayMongo refused the refund: too early" })]}
      />,
    );

    expect(screen.getByText("1 needs a manual refund in PayMongo")).toBeInTheDocument();
    expect(screen.getByText("PayMongo refused the refund: too early")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark refunded" }));

    await waitFor(() =>
      expect(markRefundedByHand).toHaveBeenCalledWith("3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f"),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the error when marking fails", async () => {
    markRefundedByHand.mockResolvedValue({ data: null, error: "Couldn't mark this refund as done." });
    render(<RefundsPanel refunds={[refund({ status: "refund_failed" })]} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark refunded" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't mark this refund as done.");
    expect(refresh).not.toHaveBeenCalled();
  });
});
