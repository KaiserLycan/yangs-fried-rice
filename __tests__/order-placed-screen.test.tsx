import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderPlacedScreen } from "@/components/checkout/order-placed-screen";
import { ToastProvider } from "@/components/ui/toast";
import type { PlacedOrder } from "@/lib/checkout/placed-order";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

/**
 * The confirmation screen sits behind `middleware.ts`'s auth gate and cannot
 * be reached in a browser from this environment, the same position checkout
 * is in. Every test here maps to an acceptance criterion on
 * `.scratch/ordering-flow/issues/13-order-placed-confirmation.md`.
 */

const profile: CustomerProfile = {
  name: "Liza Reyes",
  dateOfBirth: null,
  mobile: "09175550123",
  email: "liza@example.com",
  memberSince: null,
  orderCount: 0,
  deliverToAddress: "21 Mabini St, Malate, Manila",
  addresses: [],
};

const order = (overrides: Partial<PlacedOrder> = {}): PlacedOrder => ({
  orderId: "example-1042",
  orderNumber: "1042",
  customerName: "Liza Reyes",
  placedAtLabel: "Aug 30, 6:40 PM",
  address: "21 Mabini St, Malate, Manila",
  fulfilment: "delivery",
  paymentMethodLabel: "Cash on delivery",
  lines: [
    {
      id: "1",
      name: "Yangzhou Special",
      unitPrice: 180,
      quantity: 2,
      specialInstructions: null,
    },
    {
      id: "2",
      name: "Lumpia (5pc)",
      unitPrice: 90,
      quantity: 1,
      specialInstructions: null,
    },
  ],
  ...overrides,
});

function renderScreen(placed: PlacedOrder = order()) {
  return render(
    <ToastProvider>
      <OrderPlacedScreen profile={profile} order={placed} />
    </ToastProvider>,
  );
}

describe("OrderPlacedScreen", () => {
  it("says the order was placed and shows its number", () => {
    renderScreen();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /order placed/i,
    );
    expect(screen.getByText(/#1042/)).toBeInTheDocument();
  });

  it("tells a delivery customer when it arrives and where it is going", () => {
    renderScreen();
    const line = screen.getByTestId("fulfilment-line");
    expect(line).toHaveTextContent(/arriving/i);
    expect(line).toHaveTextContent("35–45 min");
    expect(line).toHaveTextContent("21 Mabini St, Malate, Manila");
  });

  it("tells a pickup customer when it is ready, and never mentions delivery", () => {
    renderScreen(order({ fulfilment: "pickup", address: null }));
    const line = screen.getByTestId("fulfilment-line");
    expect(line).toHaveTextContent(/ready/i);
    expect(line).not.toHaveTextContent(/arriving/i);
    expect(screen.queryByText(/delivery fee/i)).not.toBeInTheDocument();
    expect(screen.queryByText("21 Mabini St, Malate, Manila")).toBeNull();
  });

  it("shows every line, the delivery fee and the amount payable", () => {
    renderScreen();
    expect(screen.getByText("2× Yangzhou Special")).toBeInTheDocument();
    expect(screen.getByText("1× Lumpia (5pc)")).toBeInTheDocument();
    expect(screen.getByText("Delivery fee")).toBeInTheDocument();
    expect(screen.getByText("Amount payable")).toBeInTheDocument();
    // 180×2 + 90 + 95 fee.
    expect(screen.getByText("₱545")).toBeInTheDocument();
  });

  it("shows the chosen payment method without claiming money was taken", () => {
    renderScreen();
    const payment = screen.getByTestId("payment-method");
    expect(payment).toHaveTextContent("Cash on delivery");
    expect(payment).not.toHaveTextContent(/paid|charged|receipt of payment/i);
  });

  it("links through to that order's tracking screen", () => {
    renderScreen();
    // Exact, because the nav bar carries its own "Track order" link.
    const track = screen.getByRole("link", { name: "Track this order" });
    expect(track).toHaveAttribute("href", "/orders/example-1042");
  });

  it("offers nothing that changes the order", () => {
    renderScreen();
    // No quantity steppers, no remove control, no second Place order button.
    expect(screen.queryByRole("button", { name: /place order/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^[+-]$/ })).toBeNull();
    // The same check checkout uses to prove no card details are collected.
    expect(document.querySelector("input")).toBeNull();
  });

  it("offers no cancel control — cancelling lives on the tracking screen", () => {
    renderScreen();
    expect(screen.queryByText(/cancel/i)).toBeNull();
  });
});
