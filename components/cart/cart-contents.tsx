"use client";

import * as React from "react";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { CartTotalsSummary } from "@/components/cart/cart-totals-summary";
import { FulfilmentToggle } from "@/components/cart/fulfilment-toggle";
import {
  computeCartTotals,
  type CartLine,
  type Fulfilment,
} from "@/lib/menu/cart-totals";

/**
 * The part of the cart that is identical whether it's the desktop rail or
 * the mobile page: the Delivery/Pickup toggle, the line rows (or the empty
 * state), and the totals block. Built once and placed twice, per the
 * ticket's own instruction — the "YOUR CART" header differs enough between
 * the two placements (the rail draws its own item count; the mobile page's
 * header is a back-button page title with no count) that it stays outside
 * this component, in each page's own markup.
 */
export function CartContents({
  lines,
  ctaLabel,
  arrivalEstimate = null,
  initialFulfilment = "delivery",
}: {
  lines: CartLine[];
  ctaLabel: string;
  /** Null on the placements that draw no estimate — see `CartTotalsSummary`. */
  arrivalEstimate?: string | null;
  initialFulfilment?: Fulfilment;
}) {
  const [fulfilment, setFulfilment] =
    React.useState<Fulfilment>(initialFulfilment);

  // Optimistic UI state
  const [localLines, setLocalLines] = React.useState(lines);
  React.useEffect(() => {
    setLocalLines(lines);
  }, [lines]);

  if (localLines.length === 0) {
    return <CartEmptyState />;
  }

  const totals = computeCartTotals({ lines: localLines, fulfilment });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[14px]">
      <FulfilmentToggle value={fulfilment} onChange={setFulfilment} />

      {/* Scrolls on its own inside the sticky desktop rail (P40), so the
          totals and Checkout stay in view. On /cart the page scrolls instead. */}
      <div className="flex min-h-0 flex-col gap-[10px] overflow-y-auto">
        {localLines.map((line) => (
          <CartLineRow 
            key={line.id} 
            line={line} 
            onUpdate={(quantity) => {
              setLocalLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, quantity } : l)));
            }}
            onRemove={() => {
              setLocalLines((prev) => prev.filter((l) => l.id !== line.id));
            }}
          />
        ))}
      </div>

      <div className="flex-1" />

      <CartTotalsSummary
        totals={totals}
        ctaLabel={ctaLabel}
        arrivalEstimate={arrivalEstimate}
        fulfilment={fulfilment}
      />
    </div>
  );
}
