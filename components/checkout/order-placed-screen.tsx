import Link from "next/link";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { OrderSummaryRows } from "@/components/checkout/order-summary-rows";
import { PaymentStatusCard } from "@/components/checkout/payment-status-card";
import { SwitchToCodButton } from "@/components/checkout/switch-to-cod-button";
import { ARRIVAL_ESTIMATE } from "@/lib/checkout/arrival-estimate";
import { isUnpaidStatus } from "@/lib/validation/orders";
import type { WalletProvider } from "@/lib/checkout/payment-methods";
import type { PlacedOrder } from "@/lib/checkout/placed-order";
import { computeCartTotals } from "@/lib/menu/cart-totals";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Order placed (Browsing12, Browsing16) — the screen that proves the order
 * exists.
 *
 * **No Figma frame draws this.** Confirmed with Yuan on 2026-09-14 to derive
 * it rather than wait for one, from the two screens either side: checkout's
 * order summary (`133:1124`) is reused outright, and the "#1042 · arriving in
 * 35–45 min · to 21 Mabini St" sentence is the tracking screen's header
 * (`133:1164`) at stage zero. It wants a look from the PM — see
 * `.scratch/ordering-flow/issues/13-order-placed-confirmation.md`.
 *
 * A Server Component. Apart from the payment block — which watches an online
 * payment settle, see `PaymentStatusCard` — nothing here is interactive,
 * which is the point:
 *
 *   - **Nothing can be modified.** The cart is frozen once the order is
 *     placed, so there are no quantity steppers, no remove controls and no
 *     second Place order button. R23 stops at the confirmation prompt and
 *     this screen is the far side of it.
 *   - **Nothing can be cancelled.** Cancelling lives on the tracking screen,
 *     where the "has the kitchen confirmed it yet" boundary is already
 *     decided. A second copy of that rule here would drift out of step with
 *     the first, and the two would disagree about whether a customer may
 *     still pull out.
 *
 * So the only controls are the link onward to tracking and, when an online
 * payment has not gone through, the two ways out of that: pay again (in
 * `PaymentStatusCard`) or switch to cash on delivery. The tracking link is
 * withheld in that state — see `canTrack` below.
 */
export function OrderPlacedScreen({
  profile,
  order,
  wallet = null,
  startFailed = false,
}: {
  profile: CustomerProfile;
  order: PlacedOrder;
  /** From `?pay=` — the wallet the customer was sent to, if any. */
  wallet?: WalletProvider | null;
  /** From `?pay_error=1` — checkout could not open the wallet page. */
  startFailed?: boolean;
}) {
  // The same module the cart and checkout use. Checkout must not compute
  // money one way and its own receipt another.
  const totals = computeCartTotals({
    lines: order.lines,
    fulfilment: order.fulfilment,
  });

  const isDelivery = order.fulfilment === "delivery";

  // Whether the onward link to tracking is offered at all.
  //
  // Decided by the order's own status and nothing else. `isUnpaidStatus` is
  // the same test the kitchen and rider queues filter on, so the receipt
  // cannot disagree with them about whether an order is real: if the link is
  // offered, somebody is cooking it.
  //
  // Deliberately NOT keyed on payment status or `isWalletOrder`. Both are
  // read from the `transaction` row, and customers have no insert policy on
  // that table, so the row may be missing entirely — which would read as
  // "not a wallet order" and hand out a Track link for food nobody has paid
  // for. A pay-later order (cash on delivery, pay in store) is `pending` and
  // tracks immediately, which is correct: the money is collected at the door
  // by design, not missing.
  const canTrack = !isUnpaidStatus(order.orderStatus);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavBar profile={profile} currentSection="track-order" />

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[16px] px-[20px] pb-[40px] pt-[24px] md:gap-[22px] md:px-[40px] md:pt-[36px]">
        <header className="flex flex-col gap-[6px]">
          <h1 className="font-display text-[30px] text-foreground md:text-[38px] md:leading-[1.05]">
            ORDER PLACED
          </h1>
          <p className="text-[12px] uppercase tracking-[1.92px] text-muted-foreground">
            Order #{order.orderNumber}
          </p>
          {/* One sentence, and which sentence depends entirely on whether
              anybody is delivering anything. A pickup customer told their
              food is "arriving at" an address they never gave is the bug
              ticket 05 already had to fix once. */}
          <p
            data-testid="fulfilment-line"
            className="pt-[2px] text-[14px] text-muted-strong"
          >
            {!canTrack
              ? // No arrival to promise: nobody starts this one until the
                // payment lands, so a time here would be a straight lie.
                isDelivery
                ? `Waiting for payment · to ${order.address ?? "your saved address"}`
                : "Waiting for payment · collect in store"
              : isDelivery
                ? `Arriving in about ${ARRIVAL_ESTIMATE} · to ${order.address ?? "your saved address"}`
                : `Ready for collection in about ${ARRIVAL_ESTIMATE} · collect in store`}
          </p>
        </header>

        <section className="flex flex-col gap-[11px] rounded-lg border border-rule bg-card p-[20px]">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.54px] text-muted-foreground">
            Order summary
          </h2>
          <OrderSummaryRows
            customerName={order.customerName}
            placedAtLabel={order.placedAtLabel}
            address={order.address}
            fulfilment={order.fulfilment}
            lines={order.lines}
            totals={totals}
          />
        </section>

        <PaymentStatusCard
          orderId={order.orderId}
          methodLabel={order.paymentMethodLabel}
          initialStatus={order.paymentStatus}
          wallet={wallet}
          startFailed={startFailed}
        />

        {canTrack ? (
          <Link
            href={`/orders/${order.orderId}`}
            className="rounded-[13px] bg-accent p-[16px] text-center text-[15px] font-bold text-accent-foreground"
          >
            Track this order
          </Link>
        ) : (
          <div className="flex flex-col gap-[10px]">
            <p
              data-testid="tracking-blocked"
              className="text-center text-[13px] leading-[18px] text-muted-strong"
            >
              Complete payment to track your order. Nothing has been taken yet,
              and the kitchen hasn’t started it.
            </p>
            {/* "Try again with Maya" lives in the payment card above, so this
                is only the other half of the choice issue #106 asks for. */}
            <SwitchToCodButton orderId={order.orderId} />
          </div>
        )}
      </div>
    </div>
  );
}
