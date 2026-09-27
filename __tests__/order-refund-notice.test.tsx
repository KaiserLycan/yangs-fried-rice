import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderDetailModal } from "@/components/manage/orders/order-detail-modal";
import type { OrderData } from "@/types/staff-order";

/**
 * FINALE 9.4: the refund on a cancelled paid order shows on the order
 * itself, and a failed one links straight to the payment in PayMongo.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/actions/orders", () => ({
  getSeniorPwdIdPhotoUrl: vi.fn(),
}));

const cancelled: OrderData = {
  id: "order-202",
  orderNumber: "1042",
  time: "12:30 PM",
  status: "CANCELED",
  dbStatus: "cancelled",
  paymentMethod: "gcash",
  deliveryFee: 0,
  total: 250,
  items: [{ name: "Yang Chow Fried Rice", quantity: 1, price: 250 }],
  contactInfo: { name: "Ana Cruz", phone: "09175550123" },
  orderInfo: { type: "Take out" },
};

function renderWith(refund: OrderData["refund"]) {
  render(<OrderDetailModal order={{ ...cancelled, refund }} isOpen onClose={vi.fn()} />);
}

describe("Order detail refund notice", () => {
  it("links a failed refund to its payment in PayMongo", () => {
    renderWith({
      status: "refund_failed",
      error: "Payment is not yet refundable",
      paymentId: "pay_abc123",
      amount: 250,
    });

    expect(screen.getByText(/Refund failed — ₱250\.00 still owed/)).toBeInTheDocument();
    expect(screen.getByText(/Payment is not yet refundable/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open in PayMongo" })).toHaveAttribute(
      "href",
      "https://dashboard.paymongo.com/payments/pay_abc123",
    );
  });

  it("says a pending refund needs nothing from staff", () => {
    renderWith({ status: "refund_pending", error: null, paymentId: null, amount: 250 });

    expect(screen.getByText(/on its way/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open in PayMongo" })).not.toBeInTheDocument();
  });

  it("shows nothing for an order with no refund", () => {
    renderWith(undefined);

    expect(screen.queryByText(/Refund/)).not.toBeInTheDocument();
  });
});
