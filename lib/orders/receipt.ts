import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import { vatBreakdown } from "@/lib/menu/cart-totals";

/**
 * The figures on the printable receipt (limitations #12, issue #118).
 *
 * Summed in whole centavos, the same rule `lib/menu/cart-totals.ts` states,
 * so repeated addition cannot drift. Line subtotals already include each
 * line's own add-ons (`submit_cart_to_order` prices them that way); order-level
 * add-ons are added on top, then the fee, less any discount.
 */
export type ReceiptTotals = {
  /** Lines plus order-level add-ons. */
  subtotal: number;
  fee: number;
  discount: number;
  total: number;
  /** The total minus the 12% VAT already inside it (#116). */
  vatableSales: number;
  vat: number;
};

const toCentavos = (pesos: number) => Math.round((Number.isFinite(pesos) ? pesos : 0) * 100);

export function receiptTotals(
  order: Pick<TrackedOrder, "items" | "orderAddOns" | "fee" | "payment">,
): ReceiptTotals {
  const lines = order.items.reduce((sum, line) => sum + toCentavos(line.subtotal), 0);
  const orderAddOns = order.orderAddOns.reduce((sum, addOn) => sum + toCentavos(addOn.price), 0);
  const subtotal = lines + orderAddOns;
  const fee = Math.max(0, toCentavos(order.fee));
  // A discount can never take the total below zero.
  const discount = Math.min(Math.max(0, toCentavos(order.payment?.discountAmount ?? 0)), subtotal + fee);

  return {
    subtotal: subtotal / 100,
    fee: fee / 100,
    discount: discount / 100,
    total: (subtotal + fee - discount) / 100,
    // Same split as checkout. Ticket 03 makes a Senior / PWD order VAT-exempt.
    ...vatBreakdown((subtotal + fee - discount) / 100),
  };
}

/**
 * "₱1,234.50" — receipts show centavos, unlike the menu's whole-peso
 * `formatPeso`, because a discount or a VAT split rarely lands on a peso.
 */
export function formatReceiptPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const RECEIPT_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Manila",
});

/** "Sep 27, 2026, 7:12 PM", pinned to Manila for the reason `formatPlacedAt` gives. */
export function formatReceiptTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : RECEIPT_TIME_FORMAT.format(date);
}
