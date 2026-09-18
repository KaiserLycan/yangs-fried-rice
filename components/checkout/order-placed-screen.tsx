import Link from "next/link";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { OrderSummaryRows } from "@/components/checkout/order-summary-rows";
import { PaymentStatusCard } from "@/components/checkout/payment-status-card";
import { ARRIVAL_ESTIMATE } from "@/lib/checkout/arrival-estimate";
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
 * So the only control is the link onward to tracking.
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
            {isDelivery
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

        <Link
          href={`/orders/${order.orderId}`}
          className="rounded-[13px] bg-accent p-[16px] text-center text-[15px] font-bold text-accent-foreground"
        >
          Track this order
        </Link>
      </div>
    </div>
  );
}
