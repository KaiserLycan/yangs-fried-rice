import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/toast";
import type { PastOrder } from "@/lib/orders/past-order";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/actions/cart", () => ({ reorderPastOrder: vi.fn() }));
vi.mock("@/lib/actions/reviews", () => ({ submitOrderReview: vi.fn() }));

import { PastOrderCard } from "@/components/orders/past-order-card";

function order(over: Partial<PastOrder> = {}): PastOrder {
  return {
    orderId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    orderNumber: "0AE7",
    placedAt: "2026-09-26T04:00:00.000Z",
    orderStatus: "completed",
    cancelledAt: null,
    deliveryStatus: null,
    orderType: "Pickup",
    items: [],
    total: 250,
    rating: null,
    productRatings: {},
    ...over,
  };
}

function renderCard(o: PastOrder) {
  return render(
    <ToastProvider>
      <PastOrderCard order={o} />
    </ToastProvider>,
  );
}

describe("PastOrderCard actions (issue #115)", () => {
  it("offers Rate order and Reorder together on an unrated order", () => {
    renderCard(order({ rating: null }));

    expect(screen.getByRole("button", { name: /Rate order/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reorder/i })).toBeInTheDocument();
  });

  it("offers only Reorder once the order is rated", () => {
    renderCard(order({ rating: 5 }));

    expect(screen.queryByRole("button", { name: /Rate order/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reorder/i })).toBeInTheDocument();
  });
});
