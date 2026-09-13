import Link from "next/link";
import { formatPeso } from "@/lib/menu/product-listing";
import type { CartTotals, Fulfilment } from "@/lib/menu/cart-totals";

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
  showEstimate,
  fulfilment,
}: {
  totals: CartTotals;
  ctaLabel: string;
  showEstimate: boolean;
  fulfilment: Fulfilment;
}) {
  return (
    <div className="flex flex-col gap-[8px] border-t border-field-border pt-[14px]">
      <Row label="Subtotal" value={formatPeso(totals.subtotal)} />
      <Row label="Delivery fee" value={formatPeso(totals.deliveryFee)} />

      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-foreground">Total</span>
        <span className="font-display text-[23px] text-primary">
          {formatPeso(totals.total)}
        </span>
      </div>

      {showEstimate ? (
        <p className="text-[11px] text-muted-foreground">Estimated 35–45 min</p>
      ) : null}

      <Link
        href={`/checkout?fulfilment=${fulfilment}`}
        className="mt-[6px] flex items-center justify-center rounded-[12px] bg-foreground p-[15px] text-[14px] font-bold text-background"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] text-muted-foreground">{value}</span>
    </div>
  );
}
