"use client";

import { useRouter } from "next/navigation";
import { OrderSummaryRows } from "@/components/checkout/order-summary-rows";
import { submitCart } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { ARRIVAL_ESTIMATE } from "@/lib/checkout/arrival-estimate";
import { orderTypeFor } from "@/lib/checkout/fulfilment-param";
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
