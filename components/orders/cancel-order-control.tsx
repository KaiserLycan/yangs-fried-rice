"use client";

import * as React from "react";
import { isCancellable, type OrderProgress } from "@/lib/orders/order-stage";
import { cancelCustomerOrder } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

/**
 * Cancel an order the kitchen has not started yet — desktop button `133:1245`
 * and modal `133:1251`, mobile `132:481` (offered), `132:543` (withdrawn) and
 * `132:603` (the sheet).
 *
 * Pressing Cancel order cancels nothing. It opens a confirmation, because the
 * action is destructive and cannot be undone, and a single press is not a
 * decision. Confirming calls `cancelCustomerOrder` (PR #68), which owns the
 * rule — only the customer's own order, only while it is still `pending` —
 * and whose message is what the toast shows when the rule is broken.
 *
 * On success nothing here changes by hand. The tracking screen is subscribed
 * to the `order` row, so the new status arrives the same way any other
 * change would, and `progress` flips to cancelled on its own; the
 * `router.refresh()` inside `useCartAction` re-reads the page as well.
 *
 * The whole progress is passed in rather than a `cancellable` boolean.
 * `isCancellable` is false for four different reasons and only one of them is
 * "the kitchen has confirmed it" — a cancelled order and an unrecognised
 * status also withhold the control, and telling either of those customers the
 * kitchen confirmed their order would be a plain lie on screen. The status is
 * still read once, by `TrackOrderScreen`; this reads the resolved progress,
 * not the raw column.
 */

/**
 * Shown in place of the control once the kitchen has confirmed. Replacing the
 * button rather than disabling it is deliberate: a greyed-out button invites a
 * press and then explains nothing.
 *
 * Note what the sentence also settles — the same boundary governs *changing*
 * the order, not only cancelling it.
 */
const KITCHEN_CONFIRMED_NOTE =
  "The kitchen has confirmed this order, so items and quantities can no longer be changed or cancelled.";

/**
 * Why the confirmation was taken away mid-decision. Each branch has to be true
 * on its own: the customer is reading this instead of the dialog they opened,
 * and a wrong reason here is worse than a vague one.
 */
function withdrawnMessage(progress: OrderProgress): string {
  if (progress.kind === "cancelled") {
    return "This order has already been cancelled.";
  }
  if (progress.kind === "unknown") {
    return "This order’s status changed while you were deciding, so it can no longer be cancelled.";
  }
  return "The kitchen confirmed this order while you were deciding, so it can no longer be cancelled.";
}

export function CancelOrderControl({
  orderId,
  orderNumber,
  progress,
}: {
  /** The `order.order_id` the write is sent for. */
  orderId: string;
  /** The customer-facing reference, drawn as "#1042". */
  orderNumber: string;
  /** Resolved by `TrackOrderScreen` from the live order and delivery rows. */
  progress: OrderProgress;
}) {
  const showToast = useToast();
  const { run, pending } = useCartAction();
  const [open, setOpen] = React.useState(false);

  const cancellable = isCancellable(progress);
  // The one reason that has a note of its own. A cancelled or unknown order
  // renders nothing here: the headline above the timeline has already said
  // what is going on, and neither of them is the kitchen confirming anything.
  const kitchenConfirmed = progress.kind === "stage" && !cancellable;

  /**
   * The order can move over the Realtime subscription while the confirmation
   * is still on screen. The dialog states that the order has not been
   * confirmed yet, so the moment that stops being true it has to go — leaving
   * it up would put a false sentence in front of someone about to act on it.
   */
  React.useEffect(() => {
    if (cancellable || !open) return;
    setOpen(false);
    showToast(withdrawnMessage(progress));
  }, [cancellable, open, progress, showToast]);

  return (
    <>
      {cancellable ? (
        // Held while a cancel is out. The confirmation closes on the press,
        // so this is the only way back to a second write before the first
        // has settled.
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(true)}
          className="w-full rounded-md border border-primary px-[18px] py-[13px] text-[13px] font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60 md:w-auto"
        >
          Cancel order
        </button>
      ) : null}

      {kitchenConfirmed ? (
        // #C9B8AC is the frame's own value. The token collection has no rule
        // this dark for use on cream — `--rule` (#E3D6C3) is the hairline
        // divider and disappears at one dashed pixel.
        <p className="w-full rounded-[14px] border border-dashed border-[#c9b8ac] p-[13px] text-[12px] leading-[18px] text-muted-strong">
          {KITCHEN_CONFIRMED_NOTE}
        </p>
      ) : null}

      {/* Mounted whether or not the control is offered, so that withdrawing it
          closes the dialog through `close()` rather than tearing the element
          out of the top layer. Unmounting it mid-decision would drop the
          keyboard focus `showModal()` moved inside it onto <body>. */}
      <Dialog
        open={open && cancellable}
        onClose={() => setOpen(false)}
        placement="sheet"
        title="CANCEL THIS ORDER?"
        // Both halves have to be true when this is on screen. The number comes
        // from the order, and "hasn't been confirmed" is exactly the condition
        // that put the button there in the first place.
        description={`Order #${orderNumber} hasn’t been confirmed by the kitchen yet, so you can still cancel. This can’t be undone.`}
        footer={
          <>
            {/* Safe option first at both breakpoints. The mobile frame drew
                the destructive button first and filled; confirmed with Yuan
                on 2026-09-13 that the frames should agree and that the safe
                one leads. The label is the mobile frame's longer "Yes, cancel
                order" for the same reason — one label, not one per width. */}
            <Button
              variant="outline"
              className="flex-1 p-[14px]"
              onClick={() => setOpen(false)}
            >
              Keep my order
            </Button>
            {/* Closed before the result is known, on purpose. The Realtime
                row change on success would otherwise reach the withdraw
                effect above while the dialog is still up, and toast the
                customer that their order "has already been cancelled". A
                rejection needs nothing but its message either way. */}
            <Button
              variant="confirm"
              className="flex-1"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                // No reason: the design never asks for one and the action
                // defaults `cancellation_reason` itself.
                run(() => cancelCustomerOrder(orderId));
              }}
            >
              Yes, cancel order
            </Button>
          </>
        }
      />
    </>
  );
}
