"use client";

import * as React from "react";
import Link from "next/link";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { DeliveryDetailsCard } from "@/components/checkout/delivery-details-card";
import { OrderSummaryCard } from "@/components/checkout/order-summary-card";
import { PaymentMethodPicker } from "@/components/checkout/payment-method-picker";
import {
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_WALLET_PROVIDER,
  type PaymentMethodId,
  type WalletProvider,
} from "@/lib/checkout/payment-methods";
import {
  computeCartTotals,
  type CartLine,
  type Fulfilment,
} from "@/lib/menu/cart-totals";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Checkout (`133:1042` desktop, `132:411` mobile) — the last screen before
 * an order exists, and the one place a customer sees everything they are
 * about to commit to at once.
 *
 * One component for both breakpoints because the content is identical and
 * only its arrangement changes: desktop puts delivery details and payment in
 * a left column with the summary as a 520px card beside it, mobile stacks
 * the summary first, then payment, then the button. Building two components
 * would mean two copies of the same summary drifting apart.
 *
 * The selected payment method (and, for a wallet, which wallet) is the only
 * state here. It goes down to `OrderSummaryCard`, which decides on "Place
 * order" whether the order is simply created or also sent off for payment.
 */
export function CheckoutScreen({
  profile,
  cartId,
  lines,
  fulfilment,
  distanceKm = null,
  placedAtLabel,
}: {
  profile: CustomerProfile;
  /** The active cart's id — what `submitCart` turns into an order. `null`
   * only when there are no lines either, so the empty state renders. */
  cartId: string | null;
  lines: CartLine[];
  fulfilment: Fulfilment;
  /** Distance to the delivery address, when known — sets the delivery fee. */
  distanceKm?: number | null;
  placedAtLabel: string;
}) {
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodId>(
    DEFAULT_PAYMENT_METHOD,
  );
  const [wallet, setWallet] = React.useState<WalletProvider>(
    DEFAULT_WALLET_PROVIDER,
  );

  const totals = computeCartTotals({ lines, fulfilment, distanceKm });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavBar profile={profile} currentSection="menu" />

      {/* Mobile header (`132:418`) — a back control and the page title, the
          same shape `/cart` uses. Desktop's own "← Back to menu" control sits
          inside the content column instead, so each is written where its
          frame puts it rather than one being made to serve both. */}
      <div className="flex items-center gap-[12px] border-b border-rule px-[20px] py-[16px] md:hidden">
        <Link
          href={`/cart?fulfilment=${fulfilment}`}
          aria-label="Back to cart"
          className="flex size-[36px] items-center justify-center rounded-pill bg-track text-[16px] font-bold text-foreground"
        >
          ←
        </Link>
        <h1 className="font-display text-[22px] text-foreground">
          REVIEW ORDER
        </h1>
      </div>

      <div className="flex flex-col gap-[16px] px-[20px] pb-[24px] pt-[16px] md:gap-[22px] md:px-[40px] md:pt-[30px]">
        <div className="hidden items-center gap-[14px] md:flex">
          {/* Carries the fulfilment choice back with it — the desktop cart is
              a rail inside /menu, and it would otherwise re-initialise to
              Delivery and quietly re-add the ₱95 fee. */}
          <Link
            href={`/menu?fulfilment=${fulfilment}`}
            className="rounded-sm border border-field-border bg-card px-[14px] pb-[11px] pt-[9px] text-[13px] font-bold text-foreground"
          >
            ← Back to menu
          </Link>
          <h1 className="font-display text-[32px] text-foreground">CHECKOUT</h1>
        </div>

        {lines.length === 0 || cartId === null ? (
          <EmptyCart />
        ) : (
          /* One grid, not two trees. The frames differ only in arrangement —
             mobile stacks summary then payment (`132:423`), desktop puts
             delivery details and payment in a left column with the summary
             beside them (`133:1083`) — so each card is written once and
             placed by grid position. Rendering both layouts and hiding one
             would put two "Place order" buttons and two payment radiogroups
             in the DOM at all times. */
          <div className="grid grid-cols-1 gap-[16px] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-start md:gap-[24px]">
            <div className="order-2 flex flex-col gap-[18px] md:order-1">
              {/* Delivery details are desktop-only per the frames, and only
                  for an order actually being delivered — a pickup order has
                  no address to confirm, and telling that customer to add one
                  "before choosing delivery" would read as a blocker on an
                  order that needs no address at all. */}
              {fulfilment === "delivery" ? (
                <div className="hidden md:block">
                  <DeliveryDetailsCard profile={profile} />
                </div>
              ) : null}

              <section className="flex flex-col gap-[12px] md:rounded-lg md:border md:border-rule md:bg-card md:p-[20px]">
                <h2 className="text-[12px] font-bold uppercase tracking-[1.44px] text-muted-foreground md:text-[11px] md:tracking-[1.54px]">
                  Payment method
                </h2>
                <PaymentMethodPicker
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  wallet={wallet}
                  onWalletChange={setWallet}
                />
              </section>
            </div>

            <div className="order-1 md:order-2">
              <OrderSummaryCard
                customerName={profile.name}
                placedAtLabel={placedAtLabel}
                address={profile.deliverToAddress}
                cartId={cartId}
                fulfilment={fulfilment}
                lines={lines}
                totals={totals}
                paymentMethod={paymentMethod}
                wallet={wallet}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Nothing in the cart is a real state to reach here — `/cart` links straight
 * to this screen and nothing stops someone typing the URL — so it gets a
 * deliberate treatment rather than a summary of nothing with a "Place order ·
 * ₱0" button under it.
 */
function EmptyCart() {
  return (
    <div className="flex flex-col items-start gap-[10px] rounded-lg border border-rule bg-card p-[20px]">
      <p className="text-[14px] font-bold text-foreground">
        There is nothing to check out yet.
      </p>
      <p className="text-[13px] text-muted-foreground">
        Add a dish to your cart and it will show up here for review.
      </p>
      <Link
        href="/menu"
        className="mt-[4px] rounded-[13px] bg-accent px-[18px] py-[12px] text-[14px] font-bold text-accent-foreground"
      >
        Browse the menu
      </Link>
    </div>
  );
}
