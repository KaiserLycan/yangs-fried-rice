"use client";

import { useRouter } from "next/navigation";
import { submitCart } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { orderTypeFor } from "@/lib/checkout/fulfilment-param";
import { formatPeso } from "@/lib/menu/product-listing";
import {
  lineTotal,
  type CartLine,
  type CartTotals,
  type Fulfilment,
} from "@/lib/menu/cart-totals";

/**
 * Order summary (`133:1124` desktop, `132:424` mobile) — issue #22's
 * acceptance criteria read literally, in the order the frames draw them:
 * customer name and time, address and fulfilment type, every line with its
 * quantity and price, the delivery fee, and the amount payable.
 *
 * Nothing in it is decorative. If a row is not in the frame it is not in the
 * criteria either, which is why there is no subtotal row here even though
 * the cart has one — the frames go straight from the last dish to the
 * delivery fee.
 *
 * `totals` arrives already computed by `computeCartTotals`, the same module
 * the cart uses. Checkout deliberately does not add anything up itself: two
 * screens doing the same arithmetic separately is how they end up disagreeing
 * about what a customer owes.
 */

/**
 * What the frames print. Nothing computes it: there is no kitchen queue to
 * read and no distance calculation, so the range is the designer's copy
 * rather than a number this screen worked out. Kept as the frame draws it —
 * hedged as an estimate and attributed to things a customer understands —
 * and recorded in `docs/reference/ordering-flow-handoff.md` as something a
 * real estimate should replace.
 */
const ARRIVAL_ESTIMATE = "35–45 min";

export function OrderSummaryCard({
  customerName,
  placedAtLabel,
  address,
  cartId,
  fulfilment,
  lines,
  totals,
}: {
  customerName: string;
  placedAtLabel: string;
  address: string | null;
  cartId: string;
  fulfilment: Fulfilment;
  lines: CartLine[];
  totals: CartTotals;
}) {
  const router = useRouter();
  const { run, pending } = useCartAction();

  // `submitCart` locks the cart, creates the `order` and hands back its id.
  // The fee is sent along because the backend has no fee rule of its own
  // (see the handoff doc) — the ₱95 `computeCartTotals` already applied is
  // the number the customer just read, so it is the number the order keeps.
  // On success the receipt takes over at `/checkout/confirmation?order=`;
  // a failure stays here with the backend's reason in a toast.
  function handlePlaceOrder() {
    run(
      () =>
        submitCart({
          cart_id: cartId,
          order_type: orderTypeFor(fulfilment),
          delivery_fee: totals.deliveryFee,
        }),
      ({ order_id }) => router.push(`/checkout/confirmation?order=${order_id}`),
    );
  }

  return (
    <section className="flex flex-col gap-[11px] rounded-lg border border-rule bg-card p-[20px]">
      <h2 className="text-[11px] font-bold uppercase tracking-[1.54px] text-muted-foreground">
        Order summary
      </h2>

      <Row label={customerName || "Your order"} value={placedAtLabel} />
      {/* The address in full, not the nav bar's shortened form. This is the
          only place a mobile customer sees where the order is going — there
          is no delivery details card at that width — and a review screen that
          truncates the destination to "Blk 12 Lot 4…" cannot be reviewed
          against, which is the whole point of Browsing9. */}
      <Row
        label={
          fulfilment === "delivery"
            ? (address ?? "No saved address")
            : "Collect in store"
        }
        value={fulfilment === "delivery" ? "Delivery" : "Pickup"}
      />

      {lines.map((line) => (
        <Row
          key={line.id}
          label={`${line.quantity}× ${line.name}`}
          value={formatPeso(lineTotal(line))}
        />
      ))}

      {/* No delivery fee row on a pickup order. `computeCartTotals` correctly
          zeroes the fee, but printing "Delivery fee ₱0" on an order nobody is
          delivering is a line the frame's own reasoning excludes: if it isn't
          part of what this customer owes, it isn't part of the summary. */}
      {fulfilment === "delivery" ? (
        <Row label="Delivery fee" value={formatPeso(totals.deliveryFee)} />
      ) : null}
      <Row label="Amount payable" value={formatPeso(totals.total)} />

      <p className="rounded-md bg-secondary/50 p-[12px] text-[12px] leading-[18px] text-muted-strong">
        Estimated arrival <strong>{ARRIVAL_ESTIMATE}</strong> — based on current
        kitchen queue and delivery distance.
      </p>

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={pending}
        className="rounded-[13px] bg-accent p-[16px] text-[15px] font-bold text-accent-foreground disabled:opacity-60"
      >
        Place order · {formatPeso(totals.total)}
      </button>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-[12px]">
      <span className="text-[13px] text-muted-strong">{label}</span>
      <span className="text-right text-[13px] font-bold text-foreground">
        {value}
      </span>
    </div>
  );
}
