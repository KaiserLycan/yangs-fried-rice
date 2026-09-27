import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CheckoutScreen } from "@/components/checkout/checkout-screen";
import { ToastProvider } from "@/components/ui/toast";
import type { CartLine } from "@/lib/menu/cart-totals";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { recheckCart, removeCartItem, submitCart } from "@/lib/actions/cart";

/**
 * FINALE 9.1 and 9.10: when the database refuses an order because a dish
 * sold out or a price moved, checkout names the lines, highlights them, and
 * offers "Remove sold-out items" / "Accept new prices" instead of a toast.
 */
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh, replace: vi.fn() }),
}));

vi.mock("@/lib/actions/cart", () => ({
  submitCart: vi.fn(),
  recheckCart: vi.fn(),
  removeCartItem: vi.fn(),
}));

vi.mock("@/lib/checkout/paymongo", () => ({
  isOnlinePaymentConfigured: vi.fn(() => true),
  startWalletPayment: vi.fn(),
}));

const profile: CustomerProfile = {
  firstName: "Liza",
  lastName: "Reyes",
  name: "Liza Reyes",
  mobile: "09175550123",
  email: "liza@example.com",
  passwordLastUpdated: null,
  profileImageUrl: null,
  memberSince: null,
  orderCount: 0,
};

const lines: CartLine[] = [
  { id: "1", name: "Yangzhou Special", unitPrice: 180, quantity: 2, specialInstructions: null },
  { id: "2", name: "Spicy Garlic Chicken", unitPrice: 210, quantity: 1, specialInstructions: null },
];

function renderCheckout() {
  render(
    <ToastProvider>
      <CheckoutScreen
        profile={profile}
        cartId="cart-1"
        lines={lines}
        fulfilment="pickup"
        placedAtLabel="Aug 30, 6:40 PM"
        arrivalEstimate="30–40 min"
      />
    </ToastProvider>,
  );
}

// The full suite runs these beside 110 other files; the default 1s wait is
// not always enough for the submit → re-check round trip under that load.
const SLOW = { timeout: 5000 };

// Matches while the submit is still settling, too ("Placing order…").
const placeOrder = () =>
  screen.getAllByRole("button", { name: /Place order|Placing order/ })[0];

beforeEach(() => {
  vi.mocked(removeCartItem).mockResolvedValue({ data: { success: true }, error: null });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Checkout cart re-check", () => {
  it("highlights a sold-out dish and removes it on request (9.1)", async () => {
    vi.mocked(submitCart).mockResolvedValue({
      data: null,
      error: "No longer available: Spicy Garlic Chicken. Remove it from your cart to continue.",
      code: "ITEM_UNAVAILABLE",
    });
    vi.mocked(recheckCart).mockResolvedValue({
      data: { unavailable: [{ id: "2", name: "Spicy Garlic Chicken" }], priceChanges: [] },
      error: null,
    });
    renderCheckout();

    fireEvent.click(placeOrder());

    expect(await screen.findByRole("alert", {}, SLOW)).toHaveTextContent(
      /Sold out since you added it: Spicy Garlic Chicken/,
    );
    expect(recheckCart).toHaveBeenCalledWith("cart-1", { "1": 180, "2": 210 });
    expect(screen.getByText(/Sold out — remove it/)).toBeInTheDocument();
    expect(placeOrder()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Remove sold-out item" }));

    await waitFor(() => expect(removeCartItem).toHaveBeenCalledWith("2"), SLOW);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), SLOW);
    expect(refresh).toHaveBeenCalled();
  });

  it("shows old → new prices and lets the customer accept them (9.10)", async () => {
    vi.mocked(submitCart).mockResolvedValue({
      data: null,
      error: "Prices changed: Yangzhou Special ₱180.00 → ₱200.00. Please review your cart.",
      code: "PRICE_CHANGED",
    });
    vi.mocked(recheckCart).mockResolvedValue({
      data: {
        unavailable: [],
        priceChanges: [{ id: "1", name: "Yangzhou Special", was: 180, now: 200 }],
      },
      error: null,
    });
    renderCheckout();

    fireEvent.click(placeOrder());

    expect(await screen.findByRole("alert", {}, SLOW)).toHaveTextContent(
      /Prices changed: Yangzhou Special ₱180 → ₱200/,
    );
    expect(screen.getByText("Now ₱200 each (was ₱180)")).toBeInTheDocument();
    expect(placeOrder()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Accept new prices" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() => expect(placeOrder()).toBeEnabled(), SLOW);
    expect(removeCartItem).not.toHaveBeenCalled();
  });

  it("does not re-check for other refusals", async () => {
    vi.mocked(submitCart).mockResolvedValue({
      data: null,
      error: "The store is closed.",
      code: "STORE_CLOSED",
    });
    renderCheckout();

    fireEvent.click(placeOrder());

    expect(await screen.findByText("The store is closed.", {}, SLOW)).toBeInTheDocument();
    expect(recheckCart).not.toHaveBeenCalled();
  });
});
