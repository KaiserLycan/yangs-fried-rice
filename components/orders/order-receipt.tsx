"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { formatOrderType } from "@/lib/orders/format";
import { isPaidStatus, paymentLabelFor } from "@/lib/orders/payment";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import {
  formatReceiptNumber,
  formatReceiptPeso,
  formatReceiptTime,
  receiptChange,
  receiptTotals,
} from "@/lib/orders/receipt";
import { PICKUP_COUNTER, RECEIPT_BUSINESS, SUPPORT_PHONE } from "@/lib/site/site-info";
import { Button } from "@/components/ui/button";

export const NOT_OFFICIAL_RECEIPT = "This is not an official receipt";

/** The element the print stylesheet in `app/globals.css` keeps; see there. */
export const RECEIPT_PRINT_ROOT_ID = "receipt-print-root";

type ReceiptOrder = Pick<
  TrackedOrder,
  | "orderNumber"
  | "orderType"
  | "placedAt"
  | "items"
  | "orderAddOns"
  | "fee"
  | "payment"
  | "specialInstructions"
  | "completedAt"
  | "cashTendered"
  | "fulfillmentMethod"
  | "customerName"
  | "cashierName"
>;

/**
 * The order's receipt (limitations #12), laid out the way a Philippine sales
 * receipt is: the seller block (registered name, address, VAT Reg. TIN, BIR
 * permit), the receipt and order numbers, date and time, cashier and
 * customer; every line with its add-ons; the Senior Citizen / PWD or promo
 * discount, the tip, the amount due, cash tendered and change; VATable,
 * VAT-exempt and zero-rated sales with the 12% VAT; and the payment method
 * with its reference. A Senior Citizen / PWD order also prints the ID number,
 * the name on the ID and a signature line. Plus a "Print / Save as PDF" button.
 *
 * It is labelled "not an official receipt" on screen and on paper: the
 * store's BIR-registered receipt is issued at the counter, and this is the
 * customer's own record of what they ordered.
 *
 * Printing: the same content is portalled to `<body>` inside
 * `#receipt-print-root`, which is hidden on screen. The print stylesheet
 * hides every other child of `<body>`, so the page prints as just the
 * receipt — no nav, no timeline, no blank pages where they were.
 */
export function OrderReceipt({ order }: { order: ReceiptOrder }) {
  const [printTarget, setPrintTarget] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => setPrintTarget(document.body), []);

  return (
    <section
      aria-labelledby="order-receipt-heading"
      className="flex w-full flex-col gap-[12px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <h2 id="order-receipt-heading" className="font-display text-2xl text-foreground">
          Receipt
        </h2>
        <Button variant="unstyled"
          type="button"
          onClick={() => window.print()}
          className="flex min-h-[44px] items-center gap-[8px] rounded-md border border-field-border bg-card px-[14px] text-sm font-bold text-foreground transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Printer aria-hidden="true" className="size-[18px]" />
          Print / Save as PDF
        </Button>
      </div>

      <ReceiptBody order={order} />

      {printTarget
        ? createPortal(
            <div id={RECEIPT_PRINT_ROOT_ID} aria-hidden="true" className="hidden">
              <div className="receipt-paper">
                <ReceiptBody order={order} />
              </div>
            </div>,
            printTarget,
          )
        : null}
    </section>
  );
}

const DISCOUNT_LABEL: Record<string, string> = {
  senior_citizen: "Senior Citizen",
  pwd: "PWD",
};

function discountLabel(payment: ReceiptOrder["payment"]): string {
  if (!payment?.discountType) return "";
  if (payment.discountType === "promo") {
    return payment.promoCode ? ` (Promo ${payment.promoCode})` : " (Promo)";
  }
  return ` (${DISCOUNT_LABEL[payment.discountType] ?? payment.discountType})`;
}

/** A label/value row; the value is right-aligned. */
function Row({
  label,
  children,
  strong = false,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <>
      <dt className={strong ? "pt-[6px] text-base font-bold" : "text-muted-strong"}>{label}</dt>
      <dd className={strong ? "pt-[6px] text-right text-base font-bold" : "text-right"}>{children}</dd>
    </>
  );
}

function ReceiptBody({ order }: { order: ReceiptOrder }) {
  const totals = receiptTotals(order);
  const payment = order.payment;
  const paid = isPaidStatus(payment?.status);
  const isSeniorPwd = payment?.discountType === "senior_citizen" || payment?.discountType === "pwd";
  const isCash = (payment?.method ?? "").toLowerCase() === "pay_in_store";
  const tendered = isCash ? (order.cashTendered ?? null) : null;
  const change = receiptChange(tendered, totals.amountDue);

  return (
    <div className="flex flex-col gap-[12px] text-sm text-foreground">
      {/* Seller */}
      <div className="flex flex-col items-center gap-[2px] text-center">
        <p className="receipt-brand font-display text-2xl">{RECEIPT_BUSINESS.tradeName}</p>
        {RECEIPT_BUSINESS.registeredName !== RECEIPT_BUSINESS.tradeName ? (
          <p>{RECEIPT_BUSINESS.registeredName}</p>
        ) : null}
        <p className="text-muted-strong">{RECEIPT_BUSINESS.address}</p>
        {SUPPORT_PHONE ? <p className="text-muted-strong">Tel. {SUPPORT_PHONE}</p> : null}
        <p className="text-muted-strong">VAT Reg. TIN: {RECEIPT_BUSINESS.vatRegTin ?? "—"}</p>
        <p className="text-muted-strong">BIR Permit No.: {RECEIPT_BUSINESS.birPermitNumber ?? "—"}</p>
      </div>

      <p className="rounded-md border border-dashed border-field-border px-[12px] py-[8px] text-center text-sm font-bold uppercase tracking-[0.5px] text-muted-strong">
        {NOT_OFFICIAL_RECEIPT}
      </p>

      {/* Receipt details */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[4px]">
        <Row label="Receipt no.">
          <span className="font-bold">{formatReceiptNumber(order.orderNumber)}</span>
        </Row>
        <Row label="Order number">#{order.orderNumber}</Row>
        <Row label="Date / time placed">{formatReceiptTime(order.placedAt)}</Row>
        {order.completedAt ? (
          <Row label="Date / time picked up">{formatReceiptTime(order.completedAt)}</Row>
        ) : null}
        {order.cashierName ? <Row label="Cashier">{order.cashierName}</Row> : null}
        <Row label="Customer">{order.customerName ?? "—"}</Row>
        <Row label="Order type">
          {formatOrderType(order.orderType)} · {PICKUP_COUNTER}
          {order.fulfillmentMethod === "3rd_party_courier" ? " · Courier pickup" : ""}
        </Row>
      </dl>

      <table className="w-full border-collapse">
        <caption className="sr-only">Items</caption>
        <thead>
          <tr className="border-b border-rule text-left text-sm text-muted-strong">
            <th scope="col" className="py-[6px] font-bold">Item</th>
            <th scope="col" className="py-[6px] text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((line) => (
            <tr key={line.orderItemId} className="border-b border-rule align-top">
              <td className="py-[8px] pr-[12px]">
                <span className="font-bold">
                  {line.quantity}× {line.name}
                </span>
                <span className="block text-muted-strong">
                  {formatReceiptPeso(line.unitPrice)} each
                </span>
                {line.addOns.map((addOn, index) => (
                  <span key={`${addOn.name}-${index}`} className="block text-muted-strong">
                    + {addOn.name} ({formatReceiptPeso(addOn.price)})
                  </span>
                ))}
                {line.specialInstructions ? (
                  <span className="block italic text-muted-strong">
                    Note: {line.specialInstructions}
                  </span>
                ) : null}
              </td>
              <td className="py-[8px] text-right tabular-nums">{formatReceiptPeso(line.subtotal)}</td>
            </tr>
          ))}
          {order.orderAddOns.map((addOn, index) => (
            <tr key={`order-add-on-${index}`} className="border-b border-rule">
              <td className="py-[8px] pr-[12px]">+ {addOn.name}</td>
              <td className="py-[8px] text-right tabular-nums">{formatReceiptPeso(addOn.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Amounts */}
      <dl className="grid grid-cols-[1fr_auto] gap-y-[4px] tabular-nums">
        <Row label="Subtotal (VAT inclusive)">{formatReceiptPeso(totals.subtotal)}</Row>
        {totals.fee > 0 ? <Row label="Fee">{formatReceiptPeso(totals.fee)}</Row> : null}
        {isSeniorPwd ? <Row label="Less: VAT (12%)">−{formatReceiptPeso(totals.lessVat)}</Row> : null}
        <Row label={`Less: Discount${discountLabel(payment)}`}>
          {totals.discount > 0 ? `−${formatReceiptPeso(totals.discount)}` : formatReceiptPeso(0)}
        </Row>
        <Row label="Total sale">{formatReceiptPeso(totals.total)}</Row>
        {totals.tip > 0 ? <Row label="Tip">{formatReceiptPeso(totals.tip)}</Row> : null}
        <Row label="Amount due" strong>
          {formatReceiptPeso(totals.amountDue)}
        </Row>
        {tendered !== null ? (
          <>
            <Row label="Cash tendered">{formatReceiptPeso(tendered)}</Row>
            <Row label="Change">{formatReceiptPeso(change ?? 0)}</Row>
          </>
        ) : null}
      </dl>

      {/* VAT breakdown */}
      <dl className="grid grid-cols-[1fr_auto] gap-y-[4px] border-t border-rule pt-[8px] tabular-nums">
        <Row label="VATable sales">{formatReceiptPeso(totals.vatableSales)}</Row>
        <Row label="VAT-exempt sales">{formatReceiptPeso(totals.vatExemptSales)}</Row>
        <Row label="VAT zero-rated sales">{formatReceiptPeso(totals.zeroRatedSales)}</Row>
        <Row label="VAT amount (12%)">{formatReceiptPeso(totals.vat)}</Row>
      </dl>

      {/* Payment */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[4px] border-t border-rule pt-[8px]">
        <Row label="Payment">
          {paymentLabelFor(payment?.method)}
          {payment ? ` · ${paid ? "Paid" : "Not yet paid"}` : ""}
        </Row>
        {payment?.referenceNumber ? <Row label="Reference no.">{payment.referenceNumber}</Row> : null}
      </dl>

      {/* Senior Citizen / PWD — RA 9994 and RA 10754 ask for these on the receipt. */}
      {isSeniorPwd ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[4px] border-t border-rule pt-[8px]">
          <Row label="Discount type">{DISCOUNT_LABEL[payment?.discountType ?? ""]}</Row>
          <Row label={payment?.discountType === "pwd" ? "PWD ID no." : "OSCA / SC ID no."}>
            {payment?.discountIdNumber ?? "—"}
          </Row>
          <Row label="Name on ID">{payment?.nameOnId ?? "—"}</Row>
          <dt className="text-muted-strong">Signature</dt>
          <dd className="h-[28px] border-b border-foreground">
            <span className="sr-only">Signature line</span>
          </dd>
        </dl>
      ) : null}

      {order.specialInstructions ? (
        <p className="text-muted-strong">Order note: {order.specialInstructions}</p>
      ) : null}

      <p className="text-center text-muted-strong">
        Thank you for ordering from {RECEIPT_BUSINESS.tradeName}!
      </p>
    </div>
  );
}
