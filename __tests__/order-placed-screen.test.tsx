import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { OrderPlacedScreen } from "@/components/checkout/order-placed-screen";
import { ToastProvider } from "@/components/ui/toast";
import { startWalletPayment } from "@/lib/checkout/paymongo";
import type { PlacedOrder } from "@/lib/checkout/placed-order";
import type { WalletProvider } from "@/lib/checkout/payment-methods";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

// The payment card watches `transaction` for a wallet payment settling.
// `select` is what the re-read resolves; `handler` is the Realtime callback.
const select = vi.fn();
let onChange: (() => void) | null = null;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: select }),
    }),
    channel: () => {
      const channel = {
        on: (_event: string, _filter: unknown, handler: () => void) => {
          onChange = handler;
          return channel;
        },
        subscribe: () => channel,
      };
      return channel;
    },
    removeChannel: vi.fn(),
  }),
}));

vi.mock("@/lib/checkout/paymongo", () => ({
  startWalletPayment: vi.fn(),
}));

// An unpaid wallet order draws "Switch to Cash on Delivery", which refreshes
// the route on success. There is no app router in this environment.
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

vi.mock("@/lib/actions/cart", () => ({
  switchOrderToCashOnDelivery: vi.fn(),
}));

beforeEach(() => {
  select.mockResolvedValue({ data: [] });
});

afterEach(() => {
  onChange = null;
  vi.clearAllMocks();
});

/**
 * The confirmation screen sits behind `middleware.ts`'s auth gate and cannot
 * be reached in a browser from this environment, the same position checkout
 * is in. Every test here maps to an acceptance criterion on
 * `.scratch/ordering-flow/issues/13-order-placed-confirmation.md`.
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
  deliverToNote: null,
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
  paymentStatus: null,
  // The default fixture is a cash-on-delivery order: it tracks immediately,
  // which is what every pre-existing test here expects.
  isWalletOrder: false,
  orderStatus: "pending",
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

function renderScreen(
  placed: PlacedOrder = order(),
  wallet: WalletProvider | null = null,
  startFailed = false,
  // What the ETA engine answered for this order. The page reads it; this
  // component only prints it.
  arrivalWindow: string | null = "25–35 mins",
) {
  return render(
    <ToastProvider>
      <OrderPlacedScreen
        profile={profile}
        order={placed}
        wallet={wallet}
        startFailed={startFailed}
        arrivalWindow={arrivalWindow}
      />
    </ToastProvider>,
  );
}

const walletOrder = (status: PlacedOrder["paymentStatus"]) =>
  order({
    paymentMethodLabel: "GCash / Maya wallet",
    paymentStatus: status,
    isWalletOrder: true,
    // The order status the webhook would have left behind for this payment.
    // Paid releases the order into the kitchen queue; anything else holds it.
    orderStatus:
      status === "paid" || status === "refunded"
        ? "pending"
        : status === "failed"
          ? "payment_failed"
          : "awaiting_payment",
  });

describe("OrderPlacedScreen", () => {
  it("says the order was placed and shows its number", () => {
    renderScreen();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /order placed/i,
    );
    expect(screen.getByText(/#1042/)).toBeInTheDocument();
  });

  /**
   * The window is the real one now, from the ETA engine, passed in by the
   * page. It used to be the hardcoded "35–45 min" — on a receipt for an
   * order that existed and could therefore be estimated properly (#106).
   */
  it("tells a delivery customer when it arrives and where it is going", () => {
    renderScreen();
    const line = screen.getByTestId("fulfilment-line");
    expect(line).toHaveTextContent(/arriving/i);
    expect(line).toHaveTextContent("25–35 mins");
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
    expect(screen.getByText("₱500")).toBeInTheDocument();
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

  /**
   * Named rather than matched on /cancel/i: this screen carries the nav bar,
   * whose sign-out confirmation is a closed native `<dialog>`. A closed
   * `<dialog>` is `display: none` in a browser but still in the DOM, and
   * jsdom applies no UA stylesheet — so its "Cancel" button is findable here
   * while being invisible and unreachable to anyone using the app.
   */
  it("offers no cancel control — cancelling lives on the tracking screen", () => {
    renderScreen();
    expect(
      screen.queryByRole("button", { name: /cancel order/i }),
    ).toBeNull();
  });
});

describe("OrderPlacedScreen online payment", () => {
  it("offers nothing to pay for a cash order", () => {
    renderScreen();
    expect(screen.queryByRole("button", { name: /pay now/i })).toBeNull();
  });

  it("says the payment was received once the webhook has settled it", () => {
    renderScreen(walletOrder("paid"), "gcash");
    const payment = screen.getByTestId("payment-method");
    expect(payment).toHaveTextContent("GCash / Maya wallet");
    expect(payment).toHaveTextContent(/payment received/i);
    expect(screen.queryByRole("button", { name: /pay now/i })).toBeNull();
  });

  it("leaves a fresh pending payment alone — the webhook is probably seconds away", () => {
    renderScreen(walletOrder("pending"), "paymaya");
    expect(screen.getByTestId("payment-method")).toHaveTextContent(/waiting/i);
    expect(screen.queryByRole("button", { name: /pay now/i })).toBeNull();
  });

  it("offers to finish a pending payment once it has waited long enough", async () => {
    vi.useFakeTimers();
    // The card re-reads the row every few seconds while pending; keep it
    // pending so the grace period is what the test measures.
    select.mockResolvedValue({ data: [{ payment_status: "pending" }] });
    try {
      renderScreen(walletOrder("pending"), "paymaya");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20000);
      });
      expect(
        screen.getByRole("button", { name: "Pay now with Maya" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /GCash/ })).toBeNull();
      expect(screen.getByTestId("payment-method")).toHaveTextContent(
        /still waiting/i,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("says a refunded payment was refunded and offers nothing", () => {
    renderScreen(walletOrder("refunded"));
    expect(screen.getByTestId("payment-method")).toHaveTextContent(/refunded/i);
    expect(
      screen.queryByRole("button", { name: /pay now|try again/i }),
    ).toBeNull();
  });

  it("drops the failed-start message once a transaction row exists", () => {
    renderScreen(walletOrder("failed"), "gcash", true);
    const payment = screen.getByTestId("payment-method");
    expect(payment).not.toHaveTextContent(/couldn’t open your wallet/i);
    expect(payment).toHaveTextContent(/didn’t go through/i);
  });

  it("offers both wallets when the receipt is reopened without one named", () => {
    renderScreen(walletOrder("failed"));
    expect(
      screen.getByRole("button", { name: "Try again with GCash" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again with Maya" }),
    ).toBeInTheDocument();
  });

  it("offers to start a payment that never began", () => {
    renderScreen(order({ paymentMethodLabel: "Not recorded" }), "gcash");
    const payment = screen.getByTestId("payment-method");
    expect(payment).toHaveTextContent("GCash / Maya wallet");
    expect(payment).toHaveTextContent(/hasn’t started/i);
    expect(
      screen.getByRole("button", { name: "Pay now with GCash" }),
    ).toBeInTheDocument();
  });

  it("explains when checkout could not open the wallet, and still offers Pay now", () => {
    renderScreen(order({ paymentMethodLabel: "Not recorded" }), "gcash", true);
    expect(screen.getByTestId("payment-method")).toHaveTextContent(
      /couldn’t open your wallet/i,
    );
    expect(
      screen.getByRole("button", { name: "Pay now with GCash" }),
    ).toBeInTheDocument();
  });

  it("sends the customer to the wallet's page from Pay now", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://yangs.test", assign },
    });
    vi.mocked(startWalletPayment).mockResolvedValue({
      kind: "redirect",
      url: "https://gcash.test/pay",
    });
    renderScreen(walletOrder("failed"), "gcash");

    fireEvent.click(
      screen.getByRole("button", { name: "Try again with GCash" }),
    );

    await waitFor(() =>
      expect(startWalletPayment).toHaveBeenCalledWith({
        orderId: "example-1042",
        wallet: "gcash",
        returnUrl:
          "https://yangs.test/checkout/confirmation?order=example-1042&pay=gcash",
      }),
    );
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("https://gcash.test/pay"),
    );
  });

  /**
   * jsdom's `window.open` returns null, so the test above exercises the
   * popup-blocked fallback. This one stands a tab in for the real thing.
   */
  it("opens the wallet in its own tab and stays on the receipt", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://yangs.test", assign },
    });
    const tab = {
      closed: false,
      location: { href: "" },
      focus: vi.fn(),
      close: vi.fn(),
      document: { write: vi.fn(), close: vi.fn() },
    };
    vi.stubGlobal("open", vi.fn(() => tab));
    vi.mocked(startWalletPayment).mockResolvedValue({
      kind: "redirect",
      url: "https://gcash.test/pay",
    });
    renderScreen(walletOrder("failed"), "gcash");

    fireEvent.click(
      screen.getByRole("button", { name: "Try again with GCash" }),
    );

    await waitFor(() => expect(tab.location.href).toBe("https://gcash.test/pay"));
    // This tab keeps watching rather than being handed over.
    expect(assign).not.toHaveBeenCalled();
  });

  /**
   * The card used to stop watching as soon as a payment failed — only a
   * Realtime event could revive it. With the wallet in its own tab that is
   * exactly the case that matters: the customer pays over there and comes
   * back to find "Try again with GCash" on an order already paid for.
   */
  it("notices a payment that succeeded in the other tab", async () => {
    renderScreen(walletOrder("failed"), "gcash");
    expect(
      screen.getByRole("button", { name: "Try again with GCash" }),
    ).toBeInTheDocument();

    // The webhook lands while the customer is on the wallet's tab.
    select.mockResolvedValue({ data: [{ payment_status: "paid" }] });

    // Coming back to this tab is what triggers the re-read.
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() =>
      expect(screen.getByText("Payment received — thank you.")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /Try again with/ }),
    ).toBeNull();
    // The page around the card was rendered from the pre-payment order
    // status, so it has to be asked again before the Track link can appear.
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the reason when the payment cannot be restarted", async () => {
    vi.mocked(startWalletPayment).mockRejectedValue(
      new Error("This order has already been paid."),
    );
    renderScreen(walletOrder("failed"), "gcash");

    fireEvent.click(
      screen.getByRole("button", { name: "Try again with GCash" }),
    );

    expect(
      await screen.findByText("This order has already been paid."),
    ).toBeInTheDocument();
  });

  it("moves to paid when the transaction row changes underneath it", async () => {
    renderScreen(walletOrder("pending"), "gcash");
    expect(screen.getByTestId("payment-method")).toHaveAttribute(
      "data-status",
      "pending",
    );

    select.mockResolvedValue({ data: [{ payment_status: "paid" }] });
    await act(async () => {
      onChange?.();
    });

    await waitFor(() =>
      expect(screen.getByTestId("payment-method")).toHaveAttribute(
        "data-status",
        "paid",
      ),
    );
    expect(screen.queryByRole("button", { name: /pay now/i })).toBeNull();
  });
});

/**
 * Issue #106, comment 3: "When online payment fails, Order should not be able
 * to proceed to tracking and should remain in cart until payment becomes
 * successful or is switched to CoD."
 *
 * The receipt is the visible half of that. The invisible half — the order
 * being held out of the kitchen and rider queues at `awaiting_payment` — is
 * `submitCart`'s and the webhook's job.
 */
describe("OrderPlacedScreen tracking gate", () => {
  const trackLink = () =>
    screen.queryByRole("link", { name: "Track this order" });

  it("withholds tracking when the wallet payment failed", () => {
    renderScreen(walletOrder("failed"));
    expect(trackLink()).toBeNull();
    expect(screen.getByTestId("tracking-blocked")).toHaveTextContent(
      /complete payment to track your order/i,
    );
  });

  it("withholds tracking when the wallet payment never started", () => {
    renderScreen(walletOrder(null));
    expect(trackLink()).toBeNull();
  });

  it("withholds tracking while the wallet payment is still pending", () => {
    renderScreen(walletOrder("pending"));
    expect(trackLink()).toBeNull();
  });

  it("offers the way out that the issue asks for, alongside paying again", () => {
    renderScreen(walletOrder("failed"), "paymaya");
    expect(
      screen.getByRole("button", { name: /switch to cash on delivery/i }),
    ).toBeInTheDocument();
    // "Try again with Maya" — the other half of the choice.
    expect(
      screen.getByRole("button", { name: /try again with maya/i }),
    ).toBeInTheDocument();
  });

  it("restores tracking once the wallet payment is paid", () => {
    renderScreen(walletOrder("paid"));
    expect(trackLink()).toHaveAttribute("href", "/orders/example-1042");
    expect(screen.queryByTestId("tracking-blocked")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /switch to cash on delivery/i }),
    ).toBeNull();
  });

  it("never withholds tracking from a cash order, whose payment is always pending", () => {
    // The regression this guards: cash on delivery and an unpaid wallet order
    // both sit at payment_status "pending", so gating on that alone would
    // strand every cash customer on the receipt.
    renderScreen(order({ paymentStatus: "pending" }));
    expect(trackLink()).toHaveAttribute("href", "/orders/example-1042");
    expect(
      screen.queryByRole("button", { name: /switch to cash on delivery/i }),
    ).toBeNull();
  });

  it("promises no arrival time for an order nobody is cooking", () => {
    renderScreen(walletOrder("failed"));
    const line = screen.getByTestId("fulfilment-line");
    expect(line).toHaveTextContent(/waiting for payment/i);
    expect(line).not.toHaveTextContent("25–35 mins");
  });
});
