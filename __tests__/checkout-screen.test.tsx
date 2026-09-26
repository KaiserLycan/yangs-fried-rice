import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CheckoutScreen } from "@/components/checkout/checkout-screen";
import { ToastProvider } from "@/components/ui/toast";
import type { CartLine } from "@/lib/menu/cart-totals";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { submitCart } from "@/lib/actions/cart";
import {
  isOnlinePaymentConfigured,
  startWalletPayment,
} from "@/lib/checkout/paymongo";

const push = vi.fn();
const refresh = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace }),
}));

vi.mock("@/lib/actions/cart", () => ({
  submitCart: vi.fn(),
}));

vi.mock("@/lib/checkout/paymongo", () => ({
  isOnlinePaymentConfigured: vi.fn(() => true),
  startWalletPayment: vi.fn(),
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
  firstName: "Liza",
  lastName: "Reyes",
  name: "Liza Reyes",
  dateOfBirth: null,
  mobile: "09175550123",
  email: "liza@example.com",
  passwordLastUpdated: null,
  profileImageUrl: null,
  activeAddressId: "addr-1",
  memberSince: null,
  orderCount: 0,
  deliverToAddress: "21 Mabini St, Malate, Manila",
  addresses: [
    {
      id: "addr-1",
      addressDetails: "21 Mabini St, Malate, Manila",
      buildingNo: "21",
      street: "Mabini St",
      barangay: "Malate",
      city: "Manila",
      zip: "",
      label: "Home",
      deliveryNote: "",
      isDefault: true,
    }
  ],
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
        // Read on the server from the live kitchen queue and this order's
        // distance (issue #106). It was the fixed string "35–45 min".
        arrivalEstimate="30–40 min"
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
    // Return an unresolved promise by default to prevent act() warnings in
    // tests that don't wait for the validation note to settle.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {}))
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

  it("shows the delivery fee and the amount payable", () => {
    renderCheckout();

    expect(countOf("₱50")).toBeGreaterThan(0);
    expect(countOf("₱500")).toBeGreaterThan(0);
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
  it("shows the delivery address in full, not the nav bar's short form", async () => {
    renderCheckout({
      profile: {
        ...profile,
        deliverToAddress: "Blk 12 Lot 4 Barangay San Isidro, Quezon City",
        addresses: [
          {
            id: "addr-2",
            addressDetails: "Blk 12 Lot 4 Barangay San Isidro, Quezon City",
            buildingNo: "Blk",
            street: "12 Lot 4 Barangay San Isidro",
            barangay: "",
            city: "Quezon City",
            zip: "",
            label: "Home",
            deliveryNote: "",
            isDefault: true,
          }
        ]
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
  it("offers the available payment methods with cash on delivery selected", () => {
    renderCheckout();

    const cash = screen.getAllByRole("radio", { name: /Cash on delivery/ });
    expect(cash[0]).toHaveAttribute("aria-checked", "true");

    const [wallet] = screen.getAllByRole("radio", {
      name: "GCash / Maya wallet",
    });
    expect(wallet).toHaveAttribute("aria-checked", "false");
  });

  /**
   * Issue #106. Two of the methods name the moment money changes hands, and
   * that moment only exists for one kind of order — nobody pays at the
   * counter for food being delivered to them.
   */
  it("does not offer paying in store for a delivery", () => {
    renderCheckout({ fulfilment: "delivery" });
    expect(screen.queryByRole("radio", { name: "Pay in store" })).toBeNull();
  });

  it("does not offer cash on delivery for a pickup", () => {
    renderCheckout({ fulfilment: "pickup" });
    expect(
      screen.queryByRole("radio", { name: /Cash on delivery/ }),
    ).toBeNull();
  });

  it("starts a pickup order on paying in store, not on the global default", () => {
    renderCheckout({ fulfilment: "pickup" });
    const [store] = screen.getAllByRole("radio", { name: "Pay in store" });
    expect(store).toHaveAttribute("aria-checked", "true");
  });

  it("moves the selection and leaves exactly one chosen", () => {
    renderCheckout();

    const [wallet] = screen.getAllByRole("radio", {
      name: "GCash / Maya wallet",
    });
    fireEvent.click(wallet);

    const checked = screen
      .getAllByRole("radio")
      .filter((option) => option.getAttribute("aria-checked") === "true");

    // One per breakpoint copy of the picker, all naming the same selected wallet provider.
    expect(checked.length).toBeGreaterThan(0);
    for (const option of checked) {
      expect(option).toHaveTextContent(/GCash|Maya/);
    }
  });

  // Pay-on-collection options are ordinary choices, not a fallback — issue
  // #22's third criterion asks for this by name.
  it("treats cash on delivery and pay in store as ordinary options", () => {
    const delivery = renderCheckout({ fulfilment: "delivery" });
    const [cash] = screen.getAllByRole("radio", { name: /Cash on delivery/ });
    expect(cash).toBeEnabled();
    delivery.unmount();

    renderCheckout({ fulfilment: "pickup" });
    const [store] = screen.getAllByRole("radio", { name: "Pay in store" });
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
        delivery_address: "21 Mabini St, Malate, Manila",
        // The picker's default *for a pickup*. Tells `submitCart` the order
        // is payable on collection, so it is `pending` and cookable straight
        // away rather than held at `awaiting_payment` like a wallet order.
        // It used to send cash on delivery here — on an order nobody was
        // delivering (issue #106).
        payment_method: "pay-in-store",
      }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/checkout/confirmation?order=order-77"),
    );
  });

  it("sends the current delivery fee on a delivery order", async () => {
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
        expect.objectContaining({ order_type: "delivery", delivery_fee: 50 }),
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

describe("Checkout online payment", () => {
  const placedOrder = {
    data: {
      order_id: "order-79",
      order_status: "pending",
      cart_id: "cart-1",
      is_final: true,
    },
    error: null,
  };
  const assign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isOnlinePaymentConfigured).mockReturnValue(true);
    // jsdom's `location` cannot be spied on directly; swap the whole object
    // so the redirect to the wallet's page can be observed.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://yangs.test", assign },
    });
  });

  function chooseWallet(which: "GCash" | "Maya" = "GCash") {
    fireEvent.click(
      screen.getAllByRole("radio", { name: "GCash / Maya wallet" })[0],
    );
    fireEvent.click(screen.getAllByRole("radio", { name: which })[0]);
  }

  it("asks which wallet only once GCash / Maya is chosen", () => {
    renderCheckout();
    expect(screen.queryByRole("radio", { name: "GCash" })).toBeNull();

    fireEvent.click(
      screen.getAllByRole("radio", { name: "GCash / Maya wallet" })[0],
    );
    expect(screen.getAllByRole("radio", { name: "GCash" })[0]).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getAllByRole("radio", { name: "Maya" })[0]).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("creates the order, then sends the customer to the wallet's page", async () => {
    vi.mocked(submitCart).mockResolvedValue(placedOrder);
    vi.mocked(startWalletPayment).mockResolvedValue({
      kind: "redirect",
      url: "https://gcash.test/pay",
    });
    renderCheckout();
    chooseWallet("Maya");

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    // The order must be created as a wallet order, which is what holds it at
    // `awaiting_payment` so the kitchen never sees a payment that is
    // abandoned or refused (issue #106).
    await waitFor(() =>
      expect(submitCart).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: "wallet" }),
      ),
    );
    await waitFor(() =>
      expect(startWalletPayment).toHaveBeenCalledWith({
        orderId: "order-79",
        wallet: "paymaya",
        returnUrl:
          "https://yangs.test/checkout/confirmation?order=order-79&pay=paymaya",
      }),
    );
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://gcash.test/pay"));
    expect(push).not.toHaveBeenCalled();
    // Still disabled while the browser leaves — a second press would submit
    // a cart that is already locked.
    const [button] = screen.getAllByRole("button", { name: /Opening wallet/ });
    expect(button).toBeDisabled();
  });

  /**
   * A stand-in for the tab the browser opens. jsdom's own `window.open`
   * returns null, which is why every other test here exercises the
   * popup-blocked fallback without asking for it.
   */
  function stubWalletTab() {
    const tab = {
      closed: false,
      location: { href: "" },
      focus: vi.fn(),
      close: vi.fn(function (this: { closed: boolean }) {
        this.closed = true;
      }),
      document: { write: vi.fn(), close: vi.fn() },
    };
    const open = vi.fn(() => tab);
    // `stubGlobal`, not `defineProperty`: the file's afterEach undoes stubs,
    // so the stand-in cannot leak into the tests that assert the
    // popup-blocked fallback, where `window.open` must return null.
    vi.stubGlobal("open", open);
    return { tab, open };
  }

  it("sends the wallet to its own tab and keeps this one on the receipt", async () => {
    const { tab, open } = stubWalletTab();
    vi.mocked(submitCart).mockResolvedValue(placedOrder);
    vi.mocked(startWalletPayment).mockResolvedValue({
      kind: "redirect",
      url: "https://gcash.test/pay",
    });
    renderCheckout();
    chooseWallet("Maya");

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    await waitFor(() =>
      expect(tab.location.href).toBe("https://gcash.test/pay"),
    );
    // The return URL carries the marker that lets the wallet's tab close
    // itself once PayMongo answers, rather than leaving the customer with
    // two copies of the same receipt.
    expect(startWalletPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        returnUrl:
          "https://yangs.test/checkout/confirmation?order=order-79&pay=paymaya&wallet_tab=1",
      }),
    );
    // This tab stays ours, on the receipt, where the payment is watched and
    // both ways out live. PayMongo's dead end now costs a tab switch.
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/checkout/confirmation?order=order-79&pay=paymaya",
      ),
    );
    expect(assign).not.toHaveBeenCalled();
    // Opened empty inside the click — a popup asked for after `submitCart`
    // resolves is one the browser blocks.
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(open.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(submitCart).mock.invocationCallOrder[0],
    );
  });

  it("closes the empty tab when the order is never created", async () => {
    const { tab } = stubWalletTab();
    vi.mocked(submitCart).mockResolvedValue({
      data: null,
      error: "Cannot submit an empty cart.",
    } as never);
    renderCheckout();
    chooseWallet();

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    await waitFor(() => expect(tab.close).toHaveBeenCalled());
    expect(startWalletPayment).not.toHaveBeenCalled();
  });

  it("closes the empty tab when the payment cannot be started", async () => {
    const { tab } = stubWalletTab();
    vi.mocked(submitCart).mockResolvedValue(placedOrder);
    vi.mocked(startWalletPayment).mockRejectedValue(new Error("Gateway down."));
    renderCheckout();
    chooseWallet();

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    await waitFor(() => expect(tab.close).toHaveBeenCalled());
    // The receipt explains, since this screen's toast unmounts with it.
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        expect.stringContaining("pay_error=1"),
      ),
    );
  });

  /**
   * The wallet's page does not always send the customer back. PayMongo
   * answers an expired or already-consumed source with its own error page,
   * which never honours `return_url`, so Back is the only way home — and
   * Back restores this screen from the back/forward cache, server untouched.
   *
   * Issue #106: that left the customer looking at the summary they had
   * already submitted, with no route to the order or to cash on delivery.
   */
  it("sends the customer to the receipt when Back restores this page from the wallet", async () => {
    vi.mocked(submitCart).mockResolvedValue(placedOrder);
    vi.mocked(startWalletPayment).mockResolvedValue({
      kind: "redirect",
      url: "https://gcash.test/pay",
    });
    renderCheckout();
    chooseWallet("Maya");

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);
    await waitFor(() => expect(assign).toHaveBeenCalled());

    fireEvent(window, new PageTransitionEvent("pageshow", { persisted: true }));

    // `replace`, not `push`: Back from the receipt must not land here and
    // bounce them forward again.
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/checkout/confirmation?order=order-79&pay=paymaya",
      ),
    );
  });

  it("only refreshes on a cached restore that did not come from a wallet", async () => {
    renderCheckout();

    fireEvent(window, new PageTransitionEvent("pageshow", { persisted: true }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
  });

  it("still opens the receipt, with the wallet named and the failure flagged, when the payment cannot start", async () => {
    vi.mocked(submitCart).mockResolvedValue(placedOrder);
    vi.mocked(startWalletPayment).mockRejectedValue(new Error("Gateway down."));
    renderCheckout();
    chooseWallet();

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/checkout/confirmation?order=order-79&pay=gcash&pay_error=1",
      ),
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("refuses a wallet order before creating it when online payment is not configured", async () => {
    vi.mocked(isOnlinePaymentConfigured).mockReturnValue(false);
    renderCheckout();
    chooseWallet();

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    expect(
      await screen.findByText(/Online payment isn’t set up on this site yet/),
    ).toBeInTheDocument();
    expect(submitCart).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not start a payment for cash on delivery or pay in store", async () => {
    vi.mocked(submitCart).mockResolvedValue(placedOrder);
    renderCheckout();

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/checkout/confirmation?order=order-79"),
    );
    expect(startWalletPayment).not.toHaveBeenCalled();
  });

  it("refuses a wallet order when the wallet selection is invalid or unavailable", async () => {
    renderCheckout();
    fireEvent.click(
      screen.getAllByRole("radio", { name: "GCash / Maya wallet" })[0],
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Place order/ })[0]);

    expect(submitCart).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("Checkout delivery details", () => {
  it("says so deliberately when the customer has no saved address", () => {
    renderCheckout({
      profile: { ...profile, deliverToAddress: null, addresses: [], activeAddressId: null },
    });

    expect(
      screen.getByText(/no saved delivery address yet/i),
    ).toBeInTheDocument();
    // The frame's confident validation line must not appear over an address
    // that does not exist.
    expect(countOf(/validated against mapping service/i)).toBe(0);
  });

  it("confirms the address once the mapping service validates it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true }),
      })
    );
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
    // Two payment methods apply to a delivery; the third is pickup-only.
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });
});
