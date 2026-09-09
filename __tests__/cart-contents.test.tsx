import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { CartContents } from "@/components/cart/cart-contents";
import { ToastProvider } from "@/components/ui/toast";
import type { CartLine } from "@/lib/menu/cart-totals";

/**
 * `CartContents`' populated layout has no honest way to reach a real
 * browser today: every customer's cart is empty, because adding to one is
 * still a stubbed write (ticket 03). These fixture-backed tests are what the
 * ticket asks for instead — the same reasoning `site-nav-bar.test.tsx`
 * already uses for a screen behind an unavailable session.
 */
function renderCart(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const lines: CartLine[] = [
  {
    id: "1",
    name: "Yangzhou Special",
    unitPrice: 180,
    quantity: 2,
    specialInstructions: "Extra chili, no egg",
  },
  {
    id: "2",
    name: "Lumpia (5pc)",
    unitPrice: 90,
    quantity: 1,
    specialInstructions: null,
  },
];

describe("CartContents", () => {
  it("shows the empty state and nothing else when the cart has no lines", () => {
    renderCart(<CartContents lines={[]} ctaLabel="Checkout" showEstimate />);

    expect(
      screen.getByRole("link", { name: /cart is empty/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument();
  });

  it("renders every line with its name, line total and quantity", () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    expect(screen.getByText("Yangzhou Special")).toBeInTheDocument();
    expect(screen.getByText("₱360")).toBeInTheDocument(); // 180 × 2
    expect(screen.getByText("Lumpia (5pc)")).toBeInTheDocument();
    expect(screen.getByText("₱90")).toBeInTheDocument(); // 90 × 1
  });

  it("shows special instructions only for the line that has them", () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    expect(screen.getByText(/extra chili, no egg/i)).toBeInTheDocument();
    // Only one line carries a note — asserting there's exactly one keeps
    // this from passing by coincidence if a second one leaked in.
    expect(screen.getAllByText(/^Note:/)).toHaveLength(1);
  });

  it("computes the subtotal, delivery fee and total from the real lines", () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    // Delivery is the default selection, matching the frame.
    expect(screen.getByText("₱450")).toBeInTheDocument(); // subtotal: 360 + 90
    expect(screen.getByText("₱95")).toBeInTheDocument(); // delivery fee
    expect(screen.getByText("₱545")).toBeInTheDocument(); // total
  });

  it("drops the delivery fee when Pickup is chosen, and the total follows", () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    fireEvent.click(screen.getByRole("button", { name: "Pickup" }));

    expect(screen.getByText("₱0")).toBeInTheDocument(); // delivery fee
    // Subtotal and total now read the same figure, since the fee is zero —
    // both are legitimately on screen at once.
    expect(screen.getAllByText("₱450")).toHaveLength(2);
  });

  it("shows the estimate line only when asked to", () => {
    const { rerender } = renderCart(
      <CartContents lines={lines} ctaLabel="Checkout" showEstimate={false} />,
    );
    expect(screen.queryByText(/estimated/i)).not.toBeInTheDocument();

    rerender(
      <ToastProvider>
        <CartContents lines={lines} ctaLabel="Checkout" showEstimate />
      </ToastProvider>,
    );
    expect(screen.getByText(/estimated 35–45 min/i)).toBeInTheDocument();
  });

  it("uses the ctaLabel passed in for the checkout link", () => {
    renderCart(
      <CartContents lines={lines} ctaLabel="Continue to checkout" showEstimate={false} />,
    );

    expect(
      screen.getByRole("link", { name: "Continue to checkout" }),
    ).toHaveAttribute("href", "/checkout");
  });

  // The −, + and Remove controls raise a toast rather than changing what's
  // on screen — the displayed quantity is the persisted server value, and
  // there is no write yet to persist a change to.
  it("raises a toast without changing the displayed quantity when − is pressed", () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    fireEvent.click(screen.getAllByRole("button", { name: "Decrease quantity" })[0]);

    expect(
      screen.getByText(/isn.t available yet/i),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // quantity unchanged
  });
});
