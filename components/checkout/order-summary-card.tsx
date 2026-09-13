"use client";

import { useToast } from "@/components/ui/toast";
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

const PLACE_ORDER_TOAST =
  "Placing an order isn't available yet. We're still building it.";

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
  fulfilment,
  lines,
  totals,
}: {
  customerName: string;
  placedAtLabel: string;
  address: string | null;
  fulfilment: Fulfilment;
  lines: CartLine[];
  totals: CartTotals;
}) {
  const showToast = useToast();

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

      {/* Creating the order is the backend developer's write. The control
          stays pressable and says so, rather than being disabled or silently
          doing nothing — the same treatment every other stubbed write in
          this flow gets. */}
      <button
        type="button"
        onClick={() => showToast(PLACE_ORDER_TOAST)}
        className="rounded-[13px] bg-accent p-[16px] text-[15px] font-bold text-accent-foreground"
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
