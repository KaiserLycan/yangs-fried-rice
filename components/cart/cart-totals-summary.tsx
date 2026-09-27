"use client";

import * as React from "react";
import Link from "next/link";
import { formatPeso } from "@/lib/menu/product-listing";
import type { CartTotals, Fulfilment } from "@/lib/menu/cart-totals";
import { isRestaurantOpen, nextOpeningLabel } from "@/lib/store-hours";

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
}) {
  const [isClicked, setIsClicked] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(true);
  const [opensLabel, setOpensLabel] = React.useState("");

  React.useEffect(() => {
    const check = () => {
      setIsOpen(isRestaurantOpen());
      setOpensLabel(nextOpeningLabel());
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-[8px] border-t border-field-border pt-[14px]">
      <Row label="Subtotal" value={formatPeso(totals.subtotal)} />
      {/* Pickup has no fee; printing "Delivery fee ₱0" on it read as a leftover. */}
      {fulfilment === "delivery" ? (
        <Row label="Delivery fee" value={formatPeso(totals.deliveryFee)} />
      ) : null}

      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold text-foreground">Total</span>
        <span className="font-display text-2xl text-primary">
          {formatPeso(totals.total)}
        </span>
      </div>

      {arrivalEstimate ? (
        <p className="text-sm text-muted-foreground">
          Estimated {arrivalEstimate}
        </p>
      ) : null}

      <Link
        title={!isOpen ? `We're closed right now. ${opensLabel}. Your cart is saved until then.` : "Review your order and pay"}
        href={!isOpen || isClicked ? "#" : `/checkout?fulfilment=${fulfilment}`}
        onClick={(e) => {
          if (!isOpen || isClicked) {
            e.preventDefault();
            return;
          }
          setIsClicked(true);
        }}
        className={`mt-[6px] flex items-center justify-center rounded-md p-[15px] text-sm font-bold ${
          !isOpen || isClicked
            ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-60 pointer-events-none"
            : "bg-foreground text-background"
        }`}
      >
        {!isOpen ? `Closed · ${opensLabel}` : ctaLabel}
      </Link>
      {!isOpen ? (
        <p className="text-center text-sm text-muted-foreground">
          Your cart is saved — check out when we open.
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}
