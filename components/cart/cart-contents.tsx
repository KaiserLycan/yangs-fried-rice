"use client";

import * as React from "react";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { CartTotalsSummary } from "@/components/cart/cart-totals-summary";
import { FulfilmentToggle } from "@/components/cart/fulfilment-toggle";
import { computeCartTotals, type CartLine, type Fulfilment } from "@/lib/menu/cart-totals";

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
  showEstimate,
}: {
  lines: CartLine[];
  ctaLabel: string;
  showEstimate: boolean;
}) {
  // Not persisted — see FulfilmentToggle's own comment on why this is plain
  // component state rather than a value read from and written to the cart.
  const [fulfilment, setFulfilment] = React.useState<Fulfilment>("delivery");

  if (lines.length === 0) {
    return <CartEmptyState />;
  }

  const totals = computeCartTotals({ lines, fulfilment });

  return (
    <div className="flex flex-1 flex-col gap-[14px]">
      <FulfilmentToggle value={fulfilment} onChange={setFulfilment} />

      <div className="flex flex-col gap-[10px]">
        {lines.map((line) => (
          <CartLineRow key={line.id} line={line} />
        ))}
      </div>

      <div className="flex-1" />

      <CartTotalsSummary
        totals={totals}
        ctaLabel={ctaLabel}
        showEstimate={showEstimate}
      />
    </div>
  );
}
