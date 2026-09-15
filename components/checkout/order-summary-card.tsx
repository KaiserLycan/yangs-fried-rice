"use client";

import { useToast } from "@/components/ui/toast";
import { OrderSummaryRows } from "@/components/checkout/order-summary-rows";
import { ARRIVAL_ESTIMATE } from "@/lib/checkout/arrival-estimate";
import { formatPeso } from "@/lib/menu/product-listing";
import type { CartLine, CartTotals, Fulfilment } from "@/lib/menu/cart-totals";

/**
 * Order summary (`133:1124` desktop, `132:424` mobile) — issue #22's
 * acceptance criteria read literally, in the order the frames draw them:
 * customer name and time, address and fulfilment type, every line with its
 * quantity and price, the delivery fee, and the amount payable.
 *
 * The rows themselves live in `OrderSummaryRows`, which the confirmation
 * screen also renders. What stays here is what only belongs on checkout: the
 * arrival estimate and the Place order button.
 */

const PLACE_ORDER_TOAST =
  "Placing an order isn't available yet. We're still building it.";

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

      <OrderSummaryRows
        customerName={customerName}
        placedAtLabel={placedAtLabel}
        address={address}
        fulfilment={fulfilment}
        lines={lines}
        totals={totals}
      />

      <p className="rounded-md bg-secondary/50 p-[12px] text-[12px] leading-[18px] text-muted-strong">
        Estimated arrival <strong>{ARRIVAL_ESTIMATE}</strong> — based on current
        kitchen queue and delivery distance.
      </p>

      {/* Creating the order is the backend developer's write. The control
          stays pressable and says so, rather than being disabled or silently
          doing nothing — the same treatment every other stubbed write in
          this flow gets.

          It deliberately does NOT navigate to /checkout/confirmation. Sending
          a customer to a receipt for an order that was never created, with
          their cart still full behind it, would be a worse lie than the
          toast. See `.scratch/ordering-flow/issues/13-order-placed-
          confirmation.md`. */}
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
