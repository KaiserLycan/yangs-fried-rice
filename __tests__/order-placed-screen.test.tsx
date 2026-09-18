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
  paymentStatus: null,
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
) {
  return render(
    <ToastProvider>
      <OrderPlacedScreen
        profile={profile}
        order={placed}
        wallet={wallet}
        startFailed={startFailed}
      />
    </ToastProvider>,
  );
}

const walletOrder = (status: PlacedOrder["paymentStatus"]) =>
  order({ paymentMethodLabel: "GCash / Maya wallet", paymentStatus: status });

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
