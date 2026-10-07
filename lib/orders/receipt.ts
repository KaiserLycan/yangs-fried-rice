import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import { seniorPwdBreakdown, vatBreakdown } from "@/lib/menu/cart-totals";

/**
 * The figures on the printable receipt (limitations #12, issue #118).
 *
 * Summed in whole centavos, the same rule `lib/menu/cart-totals.ts` states,
 * so repeated addition cannot drift. Line subtotals already include each
 * line's own add-ons (`submit_cart_to_order` prices them that way); order-level
 * add-ons are added on top, then the fee, less any discount, then the tip.
 */
export type ReceiptTotals = {
  /** Lines plus order-level add-ons, as priced on the menu (VAT inclusive). */
  subtotal: number;
  fee: number;
  /**
   * The 12% VAT taken off a Senior Citizen / PWD order before its 20%
   * discount (RA 9994 / RA 10754). 0 for every other order.
   */
  lessVat: number;
  discount: number;
  /** What the food costs after discounts — the sale itself, before any tip. */
  total: number;
  /** The total minus the 12% VAT already inside it (#116). */
  vatableSales: number;
  /** A Senior Citizen / PWD order's sale with the VAT removed. 0 otherwise. */
  vatExemptSales: number;
  /** Always 0: the store makes no zero-rated (export-type) sales. Printed because the receipt format lists it. */
  zeroRatedSales: number;
  vat: number;
  /** The optional tip, charged on top of the sale and not subject to VAT. */
  tip: number;
  /** `total` plus `tip` — what the customer pays. */
  amountDue: number;
};

const toCentavos = (pesos: number) => Math.round((Number.isFinite(pesos) ? pesos : 0) * 100);

export function receiptTotals(
  order: Pick<TrackedOrder, "items" | "orderAddOns" | "fee" | "payment">,
): ReceiptTotals {
  const lines = order.items.reduce((sum, line) => sum + toCentavos(line.subtotal), 0);
  const orderAddOns = order.orderAddOns.reduce((sum, addOn) => sum + toCentavos(addOn.price), 0);
  const subtotal = lines + orderAddOns;
  const fee = Math.max(0, toCentavos(order.fee));
  const tip = Math.max(0, toCentavos(order.payment?.tipAmount ?? 0));

  const isSeniorPwd =
    order.payment?.discountType === "senior_citizen" ||
    order.payment?.discountType === "pwd";

  if (isSeniorPwd) {
    const breakdown = seniorPwdBreakdown((subtotal + fee) / 100);
    const exempt = toCentavos(breakdown.vatExemptSales);
    const total = toCentavos(breakdown.total);
    return {
      subtotal: subtotal / 100,
      fee: fee / 100,
      lessVat: (subtotal + fee - exempt) / 100,
      discount: breakdown.discount,
      total: total / 100,
      vatableSales: 0,
      vatExemptSales: exempt / 100,
      zeroRatedSales: 0,
      vat: 0,
      tip: tip / 100,
      amountDue: (total + tip) / 100,
    };
  }

  // A discount can never take the total below zero.
  const discount = Math.min(Math.max(0, toCentavos(order.payment?.discountAmount ?? 0)), subtotal + fee);
  const total = subtotal + fee - discount;

  return {
    subtotal: subtotal / 100,
    fee: fee / 100,
    lessVat: 0,
    discount: discount / 100,
    total: total / 100,
    // Same split as checkout. Ticket 03 makes a Senior / PWD order VAT-exempt.
    ...vatBreakdown(total / 100),
    vatExemptSales: 0,
    zeroRatedSales: 0,
    tip: tip / 100,
    amountDue: (total + tip) / 100,
  };
}

/**
 * The receipt's serial: the order number, zero-padded to eight digits
 * ("00001042"). Order numbers are handed out by the database in sequence and
 * never reused, which is what a receipt series needs. An order read without
 * its number keeps the id prefix it falls back to.
 */
export function formatReceiptNumber(orderNumber: string): string {
  return /^[0-9]+$/.test(orderNumber) ? orderNumber.padStart(8, "0") : orderNumber;
}

/** Change for a pay-in-store order, or null when no cash amount was given. */
export function receiptChange(cashTendered: number | null | undefined, amountDue: number): number | null {
  if (cashTendered === null || cashTendered === undefined || !Number.isFinite(cashTendered)) return null;
  return Math.max(0, toCentavos(cashTendered) - toCentavos(amountDue)) / 100;
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
