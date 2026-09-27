"use client";

import * as React from "react";
import Link from "next/link";
import { formatPeso } from "@/lib/menu/product-listing";
import type { CartTotals, Fulfilment } from "@/lib/menu/cart-totals";
import { useStoreStatus } from "@/lib/hooks/use-store-status";
import { storeBlockFor } from "@/lib/store/store-status";
import { BIG_ORDER_MESSAGE, isOverOrderCap } from "@/lib/cart/limits";
import { Alert } from "@/components/ui/alert";

/**
 * Subtotal, delivery fee, Total, and the call to action — `133:990` desktop
 * (adds the "Estimated 35–45 min" line), `132:368` mobile (doesn't).
 *
 * The button is a real link to `/checkout` rather than a toast-stubbed
 * control: choosing to check out isn't a write, it's navigation, the same
 * way `SiteNavBar`'s "Track order" link already points at a route ahead of
 * that route's own ticket landing. Ticket 05 builds what's actually there.
 *
 * The link carries the fulfilment choice because nothing persists it — there
 * is no fulfilment column on `cart` or `cart_item`. Without it, a customer
 * who picked Pickup here would arrive at a checkout quoting a delivery fee
 * they had just opted out of.
 */
export function CartTotalsSummary({
  totals,
  ctaLabel,
  arrivalEstimate,
  fulfilment,
  totalItems = 0,
}: {
  totals: CartTotals;
  ctaLabel: string;
  /**
   * The window to quote, or null on the placements that draw no estimate
   * (mobile's `/cart`, per frame `132:368`). This replaced a `showEstimate`
   * boolean over a hardcoded "Estimated 35–45 min" — a figure nothing
   * computed, on a screen one step from a real ETA engine (issue #106).
   */
  arrivalEstimate: string | null;
  fulfilment: Fulfilment;
  /**
   * Items in the cart (sum of quantities). Over MAX_ITEMS_PER_ORDER the
   * button is disabled with the "big order" message (issue #115); the server
   * refuses the same cart at checkout.
   */
  totalItems?: number;
}) {
  const [isClicked, setIsClicked] = React.useState(false);
  // Closed, paused or busy (issue #115). Null while the status loads: the
  // button stays usable, and checkout itself is refused server-side anyway.
  const storeStatus = useStoreStatus();
  const block = storeStatus ? storeBlockFor(storeStatus) : null;
  const tooLarge = isOverOrderCap(totalItems);
  const isOpen = block === null && !tooLarge;

  return (
    <div className="flex flex-col gap-[8px] border-t border-field-border pt-[14px]">
      <Row label="Subtotal" value={formatPeso(totals.subtotal)} />
      {/* Pickup has no fee; printing "Delivery fee ₱0" on it read as a leftover. */}
      {fulfilment === "delivery" ? (
        <Row label="Delivery fee" value={formatPeso(totals.deliveryFee)} />
      ) : null}

      <div className="flex items-baseline justify-between">
        <span className="text-[14px] font-bold text-foreground">Total</span>
        <span className="font-display text-[23px] text-primary">
          {formatPeso(totals.total)}
        </span>
      </div>

      {arrivalEstimate ? (
        <p className="text-[14px] text-muted-foreground">
          Estimated {arrivalEstimate}
        </p>
      ) : null}

      {tooLarge ? (
        <Alert role="status" className="mt-[6px]">
          {BIG_ORDER_MESSAGE}
        </Alert>
      ) : null}

      <Link
        title={
          block
            ? block.message
            : tooLarge
              ? BIG_ORDER_MESSAGE
              : "Review your order and pay"
        }
        href={!isOpen || isClicked ? "#" : `/checkout?fulfilment=${fulfilment}`}
        onClick={(e) => {
          if (!isOpen || isClicked) {
            e.preventDefault();
            return;
          }
          setIsClicked(true);
        }}
        className={`mt-[6px] flex items-center justify-center rounded-[12px] p-[15px] text-[14px] font-bold ${
          !isOpen || isClicked
            ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-60 pointer-events-none"
            : "bg-foreground text-background"
        }`}
      >
        {block?.code === "STORE_CLOSED"
          ? "Store Closed"
          : block
            ? "Very Busy — Try Again Soon"
            : tooLarge
              ? "Too Many Items"
              : ctaLabel}
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-muted-foreground">{label}</span>
      <span className="text-[14px] text-muted-foreground">{value}</span>
    </div>
  );
}
