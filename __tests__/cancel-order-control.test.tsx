import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { CancelOrderControl } from "@/components/orders/cancel-order-control";
import { ToastProvider } from "@/components/ui/toast";
import { cancelCustomerOrder } from "@/lib/actions/cart";
import type { OrderProgress } from "@/lib/orders/order-stage";

/**
 * Ticket 07. The whole point of this control is that the destructive thing
 * does not happen on the first press, so most of what is worth asserting is
 * about what *has not* happened yet — a static render cannot show that.
 *
 * Ticket 15 wired the confirmation to `cancelCustomerOrder`. The write is
 * mocked at the module boundary, as `order-rating.test.tsx` does: these
 * tests check that confirming calls it with the right order and that the
 * result is handled, not what the backend then does to the row.
 */
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("@/lib/actions/cart", () => ({
  cancelCustomerOrder: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(cancelCustomerOrder).mockResolvedValue({
    data: {} as never,
    error: null,
  });
});

const KITCHEN_NOTE =
  "The kitchen has confirmed this order, so items and quantities can no longer be changed or cancelled.";

const ORDER_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

/** The state the control is offered in — what `submitCart` writes. */
const RECEIVED: OrderProgress = {
  kind: "stage",
  stage: "received",
  orderStatus: "pending",
};
/**
 * Staff have accepted. Same stage on the timeline, but the backend will no
 * longer cancel it (ticket 15, decision A).
 */
const ACCEPTED: OrderProgress = {
  kind: "stage",
  stage: "received",
  orderStatus: "received",
};
/** The first stage in which it is withdrawn. */
const PREPARING: OrderProgress = {
  kind: "stage",
  stage: "preparing",
  orderStatus: "preparing",
};

function renderControl(props: {
  progress: OrderProgress;
  orderNumber?: string;
}) {
  return render(
    <ToastProvider>
      <CancelOrderControl
        orderId={ORDER_ID}
        orderNumber={props.orderNumber ?? "1042"}
        progress={props.progress}
      />
    </ToastProvider>,
  );
}

function confirmCancel() {
  fireEvent.click(
    within(openDialog()).getByRole("button", { name: "Yes, cancel order" }),
  );
}

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Cancel order" }));
  return screen.getByRole("dialog");
}

describe("CancelOrderControl", () => {
  it("offers the control while the order is still cancellable", () => {
    renderControl({ progress: RECEIVED });

    expect(
      screen.getByRole("button", { name: "Cancel order" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(KITCHEN_NOTE)).not.toBeInTheDocument();
  });

  it("opens the confirmation rather than cancelling anything", () => {
    renderControl({ progress: RECEIVED });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const dialog = openDialog();

    expect(
      within(dialog).getByRole("heading", { name: "CANCEL THIS ORDER?" }),
    ).toBeInTheDocument();
    // Nothing has been cancelled: the button that would do it is still
    // sitting unpressed inside the dialog.
    expect(cancelCustomerOrder).not.toHaveBeenCalled();
  });

  it("names the order and states that cancelling is still possible", () => {
    renderControl({ progress: RECEIVED, orderNumber: "0AE7" });

    expect(
      within(openDialog()).getByText(
        "Order #0AE7 hasn’t been confirmed by the kitchen yet, so you can still cancel. This can’t be undone.",
      ),
    ).toBeInTheDocument();
  });

  it("puts the safe option first, at both breakpoints", () => {
    renderControl({ progress: RECEIVED });

    // One DOM order, settled with Yuan on 2026-09-13: the mobile frame drew
    // the destructive button first and this does not follow it.
    expect(
      within(openDialog())
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Keep my order", "Yes, cancel order"]);
  });

  it("dismisses with no side effect when the order is kept", () => {
    renderControl({ progress: RECEIVED });

    fireEvent.click(
      within(openDialog()).getByRole("button", { name: "Keep my order" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cancelCustomerOrder).not.toHaveBeenCalled();
    // Still offered — keeping the order must not consume the control.
    expect(
      screen.getByRole("button", { name: "Cancel order" }),
    ).toBeInTheDocument();
  });

  it("cancels that order once the confirmation is given, and refreshes", async () => {
    renderControl({ progress: RECEIVED });

    confirmCancel();

    // No reason is passed: the design never asks for one and the action
    // defaults `cancellation_reason` itself.
    expect(cancelCustomerOrder).toHaveBeenCalledWith(ORDER_ID);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the backend's message when the cancel is rejected, and nothing else", async () => {
    vi.mocked(cancelCustomerOrder).mockResolvedValue({
      data: null,
      error: "Cannot cancel order: your food is already prepared and ready for pickup.",
    });
    renderControl({ progress: RECEIVED });

    confirmCancel();

    // A rejection is a normal outcome — the kitchen accepted at the same
    // moment. The dialog is already closed; the message is all that shows.
    expect(
      await screen.findByText(
        "Cannot cancel order: your food is already prepared and ready for pickup.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("cannot be fired twice while the write is in flight", async () => {
    let settle: (value: { data: never; error: null }) => void = () => {};
    vi.mocked(cancelCustomerOrder).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    renderControl({ progress: RECEIVED });

    confirmCancel();

    // The confirmation closed on the press, so the only way to a second
    // write is reopening it — and the opener is held while the first one
    // is still out.
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeDisabled();
    expect(cancelCustomerOrder).toHaveBeenCalledTimes(1);

    settle({ data: {} as never, error: null });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeEnabled();
  });

  it("withholds the control once staff have accepted, even at the received stage", () => {
    renderControl({ progress: ACCEPTED });

    // The backend cancels only a `pending` order. Showing the button here
    // would let it be pressed and then fail.
    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(KITCHEN_NOTE)).toBeInTheDocument();
  });

  it("replaces the control with the explanation once the kitchen has confirmed", () => {
    renderControl({ progress: PREPARING });

    expect(screen.getByText(KITCHEN_NOTE)).toBeInTheDocument();
    // Replaced, not disabled: a greyed-out button invites a press and then
    // explains nothing.
    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
  });

  it("withdraws an open confirmation when the kitchen confirms mid-decision", () => {
    const { rerender } = renderControl({ progress: RECEIVED });
    openDialog();

    rerender(
      <ToastProvider>
        <CancelOrderControl
          orderId={ORDER_ID}
          orderNumber="1042"
          progress={PREPARING}
        />
      </ToastProvider>,
    );

    // The dialog claims the kitchen has not confirmed the order. The moment
    // that stops being true it cannot stay on screen saying so.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(KITCHEN_NOTE)).toBeInTheDocument();
    expect(
      screen.getByText(
        "The kitchen confirmed this order while you were deciding, so it can no longer be cancelled.",
      ),
    ).toBeInTheDocument();
  });

  it("says nothing at all about the kitchen for a cancelled order", () => {
    renderControl({ progress: { kind: "cancelled" } });

    // The headline above the timeline already reads ORDER CANCELLED. Claiming
    // the kitchen confirmed this one would contradict it on the same screen.
    expect(screen.queryByText(KITCHEN_NOTE)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
  });

  it("says nothing at all about the kitchen for an unrecognised status", () => {
    renderControl({ progress: { kind: "unknown" } });

    // `order_status` is nullable free text, so this state arrives for real.
    // Withholding the control is right; explaining it with a fact we do not
    // have is not.
    expect(screen.queryByText(KITCHEN_NOTE)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
  });

  it("gives the real reason when an open confirmation is withdrawn by a cancellation", () => {
    const { rerender } = renderControl({ progress: RECEIVED });
    openDialog();

    rerender(
      <ToastProvider>
        <CancelOrderControl
          orderId={ORDER_ID}
          orderNumber="1042"
          progress={{ kind: "cancelled" }}
        />
      </ToastProvider>,
    );

    expect(
      screen.getByText("This order has already been cancelled."),
    ).toBeInTheDocument();
  });
});
