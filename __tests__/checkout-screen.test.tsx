import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CheckoutScreen } from "@/components/checkout/checkout-screen";
import { ToastProvider } from "@/components/ui/toast";
import type { CartLine } from "@/lib/menu/cart-totals";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { submitCart } from "@/lib/actions/cart";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/actions/cart", () => ({
  submitCart: vi.fn(),
}));

/**
 * Checkout is behind `middleware.ts`'s auth gate, so it can't be exercised
 * in a browser from this environment the way `/menu` could — these are the
 * fixture-backed checks that stand in for that, the same reasoning tickets 01
 * and 04 give for testing their signed-in screens this way.
 *
 * Every test here maps to an acceptance criterion on
 * `.scratch/ordering-flow/issues/05-checkout.md`.
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

const lines: CartLine[] = [
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
];

function renderCheckout(
  overrides: Partial<Parameters<typeof CheckoutScreen>[0]> = {},
) {
  return render(
    <ToastProvider>
      <CheckoutScreen
        profile={profile}
        cartId="cart-1"
        lines={lines}
        fulfilment="delivery"
        placedAtLabel="Aug 30, 6:40 PM"
        {...overrides}
      />
    </ToastProvider>,
  );
}

/**
 * Both breakpoints are in the DOM at once — the frames differ only in
 * arrangement, and the switch is CSS — so the summary renders twice and
 * these helpers count rather than expecting one element.
 */
function countOf(text: string | RegExp) {
  return screen.queryAllByText(text).length;
}

beforeEach(() => {
  // The address note calls the real validation route on mount. Stubbed so
  // these tests don't depend on Nominatim being reachable.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Checkout order summary", () => {
  it("shows the customer, time, address and fulfilment type", () => {
    renderCheckout();

    expect(countOf("Liza Reyes")).toBeGreaterThan(0);
    expect(countOf("Aug 30, 6:40 PM")).toBeGreaterThan(0);
    expect(countOf(/21 Mabini St/)).toBeGreaterThan(0);
    expect(countOf("Delivery")).toBeGreaterThan(0);
  });

  it("lists every line with its quantity and price", () => {
    renderCheckout();

    expect(countOf("2× Yangzhou Special")).toBeGreaterThan(0);
    expect(countOf("₱360")).toBeGreaterThan(0);
    expect(countOf("1× Lumpia (5pc)")).toBeGreaterThan(0);
    expect(countOf("₱90")).toBeGreaterThan(0);
  });

  // The totals must come from ticket 04's module, not be recomputed here —
  // 2×180 + 90 = 450, plus the ₱95 delivery fee.
  it("shows the delivery fee and the amount payable", () => {
    renderCheckout();

    expect(countOf("₱95")).toBeGreaterThan(0);
    expect(countOf("₱545")).toBeGreaterThan(0);
  });

  it("drops the delivery fee for pickup and follows it through to the total", () => {
    renderCheckout({ fulfilment: "pickup" });

    expect(countOf("₱450")).toBeGreaterThan(0);
    expect(countOf("Pickup")).toBeGreaterThan(0);
    // No "Delivery fee ₱0" row on an order nobody is delivering.
    expect(countOf("Delivery fee")).toBe(0);
  });

  // The nav bar's shortened form clips at 18 characters, and mobile has no
  // delivery details card, so this row is the only place the destination
  // appears at that width.
  it("shows the delivery address in full, not the nav bar's short form", () => {
    renderCheckout({
      profile: {
        ...profile,
        deliverToAddress: "Blk 12 Lot 4 Barangay San Isidro, Quezon City",
      },
    });

    // The nav bar's own "Deliver to" affordance still shortens it — that is
    // what it is for. What matters is that the review rows do not.
    expect(
      countOf("Blk 12 Lot 4 Barangay San Isidro, Quezon City"),
    ).toBeGreaterThan(0);
  });

  it("presents the arrival time as an estimate, not a promise", () => {
    renderCheckout();

    expect(countOf(/Estimated arrival/)).toBeGreaterThan(0);
    expect(
      countOf(/based on\s+current kitchen queue and delivery distance/),
    ).toBeGreaterThan(0);
  });

  it("says nothing to check out when the cart is empty", () => {
    renderCheckout({ lines: [] });

    expect(screen.getByText(/nothing to check out yet/i)).toBeInTheDocument();
    expect(countOf(/Place order/)).toBe(0);
  });
});

describe("Checkout payment method", () => {
  it("offers all four methods with cash on delivery selected", () => {
    renderCheckout();

    const cash = screen.getAllByRole("radio", { name: /Cash on delivery/ });
    expect(cash[0]).toHaveAttribute("aria-checked", "true");

    for (const label of [
      "Credit / debit card",
      "GCash / Maya wallet",
      "Pay in store",
    ]) {
      const [option] = screen.getAllByRole("radio", { name: label });
      expect(option).toHaveAttribute("aria-checked", "false");
    }
  });

  it("moves the selection and leaves exactly one chosen", () => {
    renderCheckout();

    const [card] = screen.getAllByRole("radio", {
      name: "Credit / debit card",
    });
    fireEvent.click(card);

    const checked = screen
      .getAllByRole("radio")
      .filter((option) => option.getAttribute("aria-checked") === "true");

    // One per breakpoint copy of the picker, all naming the same method.
    expect(checked.length).toBeGreaterThan(0);
    for (const option of checked) {
      expect(option).toHaveTextContent("Credit / debit card");
    }
  });

  // Pay-on-collection options are ordinary choices, not a fallback — issue
  // #22's third criterion asks for this by name.
  it("treats cash on delivery and pay in store as ordinary options", () => {
    renderCheckout();

    const [cash] = screen.getAllByRole("radio", { name: /Cash on delivery/ });
    const [store] = screen.getAllByRole("radio", { name: "Pay in store" });

    expect(cash).toBeEnabled();
    expect(store).toBeEnabled();
  });

  it("collects no card details anywhere on the screen", () => {
    renderCheckout();

    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/cvv|cvc|security code/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
    expect(document.querySelectorAll("input")).toHaveLength(0);
  });
});

describe("Checkout place order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the cart with the backend's order_type and the fee the customer saw, then opens the receipt", async () => {
    vi.mocked(submitCart).mockResolvedValue({
      data: {
        order_id: "order-77",
        order_status: "pending",
        cart_id: "cart-1",
        is_final: true,
      },
      error: null,
    });
    renderCheckout({ fulfilment: "pickup" });

    const [placeOrder] = screen.getAllByRole("button", { name: /Place order/ });
    fireEvent.click(placeOrder);

    await waitFor(() =>
      expect(submitCart).toHaveBeenCalledWith({
        cart_id: "cart-1",
        order_type: "take_out",
        delivery_fee: 0,
      }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/checkout/confirmation?order=order-77"),
    );
  });

  it("sends the ₱95 fee on a delivery order", async () => {
    vi.mocked(submitCart).mockResolvedValue({
      data: {
        order_id: "order-78",
        order_status: "pending",
        cart_id: "cart-1",
        is_final: true,
      },
      error: null,
    });
    renderCheckout({ fulfilment: "delivery" });

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    await waitFor(() =>
      expect(submitCart).toHaveBeenCalledWith(
        expect.objectContaining({ order_type: "delivery", delivery_fee: 95 }),
      ),
    );
  });

  it("stays on checkout and shows the backend's reason when the order is refused", async () => {
    vi.mocked(submitCart).mockResolvedValue({
      data: null,
      error: "Cart is empty.",
    });
    renderCheckout();

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    expect(await screen.findByText("Cart is empty.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("Checkout delivery details", () => {
  it("says so deliberately when the customer has no saved address", () => {
    renderCheckout({
      profile: { ...profile, deliverToAddress: null },
    });

    expect(
      screen.getByText(/no saved delivery address yet/i),
    ).toBeInTheDocument();
    // The frame's confident validation line must not appear over an address
    // that does not exist.
    expect(countOf(/validated against mapping service/i)).toBe(0);
  });

  it("confirms the address once the mapping service validates it", async () => {
    renderCheckout();

    await waitFor(() =>
      expect(countOf(/validated against mapping service/i)).toBeGreaterThan(0),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/address/validate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not claim validation when the mapping service rejects the address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          valid: false,
          message: "Address could not be found.",
        }),
      }),
    );

    renderCheckout();

    expect(
      await screen.findByText("Address could not be found."),
    ).toBeInTheDocument();
    expect(countOf(/validated against mapping service/i)).toBe(0);
  });

  it("does not claim validation when the mapping service is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderCheckout();

    expect(
      await screen.findByText(/couldn't reach the mapping service/i),
    ).toBeInTheDocument();
    expect(countOf(/validated against mapping service/i)).toBe(0);
  });

  // The route answers 400 with an `error` when `addressSchema` rejects the
  // address itself. That is a bad address, not an outage, and saying
  // "we couldn't reach the service" would send the customer looking for a
  // problem that isn't there.
  it("reports a rejected address as a bad address, not an outage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Address appears too short." }),
      }),
    );

    renderCheckout();

    expect(
      await screen.findByText("Address appears too short."),
    ).toBeInTheDocument();
    expect(countOf(/couldn't reach the mapping service/i)).toBe(0);
  });

  // A pickup order has no address to confirm, and the "add one before
  // choosing delivery" prompt would read as a blocker on an order that needs
  // no address at all.
  it("does not ask a pickup order for a delivery address", () => {
    renderCheckout({
      fulfilment: "pickup",
      profile: { ...profile, deliverToAddress: null },
    });

    expect(countOf(/no saved delivery address yet/i)).toBe(0);
    expect(countOf("Delivery details")).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Checkout layout", () => {
  // The frames differ only in arrangement, so each card is written once and
  // placed by grid position. Rendering a mobile tree and a desktop tree and
  // hiding one would leave two Place order buttons in the DOM at all times.
  it("renders each card once, not once per breakpoint", () => {
    renderCheckout();

    expect(screen.getAllByRole("button", { name: /Place order/ })).toHaveLength(
      1,
    );
    expect(screen.getAllByRole("radiogroup")).toHaveLength(1);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });
});
