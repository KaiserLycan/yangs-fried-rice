import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CancelOrderControl } from "@/components/orders/cancel-order-control";
import { ToastProvider } from "@/components/ui/toast";
import type { OrderProgress } from "@/lib/orders/order-stage";

/**
 * Ticket 07. The whole point of this control is that the destructive thing
 * does not happen on the first press, so most of what is worth asserting is
 * about what *has not* happened yet — a static render cannot show that.
 */

const KITCHEN_NOTE =
  "The kitchen has confirmed this order, so items and quantities can no longer be changed or cancelled.";

/** The state the control is offered in. */
const RECEIVED: OrderProgress = { kind: "stage", stage: "received" };
/** The first state in which it is withdrawn, and the only one with a note. */
const PREPARING: OrderProgress = { kind: "stage", stage: "preparing" };

function renderControl(props: {
  progress: OrderProgress;
  orderNumber?: string;
}) {
  return render(
    <ToastProvider>
      <CancelOrderControl
        orderNumber={props.orderNumber ?? "1042"}
        progress={props.progress}
      />
    </ToastProvider>,
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
    expect(screen.queryByText(/isn’t available yet/)).not.toBeInTheDocument();
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
    expect(screen.queryByText(/isn’t available yet/)).not.toBeInTheDocument();
    // Still offered — keeping the order must not consume the control.
    expect(
      screen.getByRole("button", { name: "Cancel order" }),
    ).toBeInTheDocument();
  });

  it("says the write is not built yet when the cancellation is confirmed", () => {
    renderControl({ progress: RECEIVED });

    fireEvent.click(
      within(openDialog()).getByRole("button", { name: "Yes, cancel order" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Cancelling an order isn’t available yet. We’re still building it.",
      ),
    ).toBeInTheDocument();
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
        <CancelOrderControl orderNumber="1042" progress={PREPARING} />
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
        <CancelOrderControl orderNumber="1042" progress={{ kind: "cancelled" }} />
      </ToastProvider>,
    );

    expect(
      screen.getByText("This order has already been cancelled."),
    ).toBeInTheDocument();
  });
});
