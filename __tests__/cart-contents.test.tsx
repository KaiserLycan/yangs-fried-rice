import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { CartContents } from "@/components/cart/cart-contents";
import { ToastProvider } from "@/components/ui/toast";
import { removeCartItem, updateCartItem } from "@/lib/actions/cart";
import type { CartLine } from "@/lib/menu/cart-totals";

/**
 * Fixture-backed, the same reasoning `site-nav-bar.test.tsx` uses: the
 * populated layout depends on a signed-in customer with rows in `cart_item`,
 * which a unit test has no business creating.
 *
 * The writes are mocked at the module boundary, so what these tests check is
 * the contract between a control and its action — which function, with which
 * arguments — not whether the backend then does the right thing with them.
 */
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

/**
 * The checkout button is disabled outside opening hours, and
 * `isRestaurantOpen()` reads the real clock — so these tests passed during the
 * day and failed after 18:00 Manila. Pinning it open makes them test the cart,
 * not the time they happen to run at. `store-hours.test.ts` covers the hours
 * rule itself.
 */
vi.mock("@/lib/store-hours", () => ({
  isRestaurantOpen: () => true,
}));

vi.mock("@/lib/actions/cart", () => ({
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateCartItem).mockResolvedValue({ data: {} as never, error: null });
  vi.mocked(removeCartItem).mockResolvedValue({
    data: { success: true },
    error: null,
  });
});

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

    expect(screen.getByText("₱450")).toBeInTheDocument();
    expect(screen.getByText("₱50")).toBeInTheDocument();
    expect(screen.getAllByText("₱500").length).toBeGreaterThan(0);
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
      <CartContents
        lines={lines}
        ctaLabel="Continue to checkout"
        showEstimate={false}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Continue to checkout" }),
    ).toHaveAttribute("href", "/checkout?fulfilment=delivery");
  });

  // Nothing persists the fulfilment choice — there is no column for it — so
  // the link carries it. Without this, picking Pickup here would land on a
  // checkout still charging the ₱95 delivery fee.
  it("carries the fulfilment choice through to checkout", () => {
    renderCart(
      <CartContents
        lines={lines}
        ctaLabel="Continue to checkout"
        showEstimate={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pickup" }));

    expect(
      screen.getByRole("link", { name: "Continue to checkout" }),
    ).toHaveAttribute("href", "/checkout?fulfilment=pickup");
  });

});

describe("CartLineRow writes", () => {
  // The displayed quantity is the persisted server value. A control never
  // edits it locally: it asks the backend, then re-reads the page.
  it("sends the new quantity to the backend and re-reads the page on +", async () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Increase quantity" })[0],
    );

    await waitFor(() =>
      expect(updateCartItem).toHaveBeenCalledWith("1", { quantity: 3 }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("removes the line instead of sending quantity 0 when − is pressed on a single item", async () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    // Line "2" (Lumpia) has quantity 1.
    fireEvent.click(
      screen.getAllByRole("button", { name: "Decrease quantity" })[1],
    );

    await waitFor(() => expect(removeCartItem).toHaveBeenCalledWith("2"));
    expect(updateCartItem).not.toHaveBeenCalled();
  });

  it("removes the line on Remove", async () => {
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    await waitFor(() => expect(removeCartItem).toHaveBeenCalledWith("1"));
  });

  it("shows the backend's own message and does not re-read when a write fails", async () => {
    vi.mocked(updateCartItem).mockResolvedValue({
      data: null,
      error: "Cart is locked.",
    });
    renderCart(<CartContents lines={lines} ctaLabel="Checkout" showEstimate />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Increase quantity" })[0],
    );

    expect(await screen.findByText("Cart is locked.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});

/**
 * Issue #106: "the quantity can go into the negatives if you click minus
 * fast." The write was the only thing checking the lower bound, and it only
 * ran 600ms after the last click — so until then the screen showed whatever
 * had been clicked down to, with the line total going negative underneath.
 * `isPending` was no defence: it only becomes true once the write starts.
 */
describe("CartLineRow lower bound", () => {
  const single: CartLine[] = [
    {
      id: "1",
      name: "Yangzhou Special",
      unitPrice: 180,
      quantity: 1,
      specialInstructions: null,
    },
  ];

  it("removes the line instead of showing zero", async () => {
    renderCart(<CartContents lines={single} ctaLabel="Checkout" showEstimate />);

    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));

    await waitFor(() => expect(removeCartItem).toHaveBeenCalledWith("1"));
    expect(screen.queryByText("0")).toBeNull();
  });

  it("never renders a negative quantity or a negative total, however fast", async () => {
    renderCart(<CartContents lines={single} ctaLabel="Checkout" showEstimate />);

    const minus = screen.getByRole("button", { name: "Decrease quantity" });
    for (let click = 0; click < 6; click += 1) fireEvent.click(minus);

    expect(screen.queryByText("-1")).toBeNull();
    expect(screen.queryByText("−1")).toBeNull();
    // A negative line total would render with a minus before the peso sign.
    expect(document.body.textContent).not.toMatch(/-\s*₱/);
    expect(document.body.textContent).not.toMatch(/₱\s*-/);
  });

  it("does not send a quantity update for a line it is removing", async () => {
    renderCart(<CartContents lines={single} ctaLabel="Checkout" showEstimate />);

    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));

    await waitFor(() => expect(removeCartItem).toHaveBeenCalled());
    expect(updateCartItem).not.toHaveBeenCalled();
  });
});
