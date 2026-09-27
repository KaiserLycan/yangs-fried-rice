"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { formatOrderType } from "@/lib/orders/format";
import { isPaidStatus, paymentLabelFor } from "@/lib/orders/payment";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import {
  formatReceiptPeso,
  formatReceiptTime,
  receiptTotals,
} from "@/lib/orders/receipt";
import { PICKUP_COUNTER, SITE_BRANCH, SITE_NAME } from "@/lib/site/site-info";

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
>;

/**
 * The order's receipt (limitations #12): every line with its add-ons, the
 * fee, any discount, the payment method and the order number, plus a
 * "Print / Save as PDF" button.
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
        <h2 id="order-receipt-heading" className="font-display text-[22px] text-foreground">
          Receipt
        </h2>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-[44px] items-center gap-[8px] rounded-[12px] border border-field-border bg-card px-[14px] text-[14px] font-bold text-foreground transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Printer aria-hidden="true" className="size-[18px]" />
          Print / Save as PDF
        </button>
      </div>

      <ReceiptBody order={order} />

      {printTarget
        ? createPortal(
            <div id={RECEIPT_PRINT_ROOT_ID} aria-hidden="true" className="hidden">
              <div className="receipt-paper">
                <p className="receipt-brand">{SITE_NAME}</p>
                <p>{SITE_BRANCH}</p>
                <ReceiptBody order={order} />
              </div>
            </div>,
            printTarget,
          )
        : null}
    </section>
  );
}

function ReceiptBody({ order }: { order: ReceiptOrder }) {
  const totals = receiptTotals(order);
  const payment = order.payment;
  const paid = isPaidStatus(payment?.status);

  return (
    <div className="flex flex-col gap-[12px] text-[14px] text-foreground">
      <p className="rounded-[10px] border border-dashed border-field-border px-[12px] py-[8px] text-center text-[14px] font-bold uppercase tracking-[0.5px] text-muted-strong">
        {NOT_OFFICIAL_RECEIPT}
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[4px]">
        <dt className="text-muted-strong">Order number</dt>
        <dd className="text-right font-bold">#{order.orderNumber}</dd>
        <dt className="text-muted-strong">Placed</dt>
        <dd className="text-right">{formatReceiptTime(order.placedAt)}</dd>
        <dt className="text-muted-strong">Order type</dt>
        <dd className="text-right">{formatOrderType(order.orderType)} · {PICKUP_COUNTER}</dd>
        <dt className="text-muted-strong">Payment</dt>
        <dd className="text-right">
          {paymentLabelFor(payment?.method)}
          {payment ? ` · ${paid ? "Paid" : "Not yet paid"}` : ""}
        </dd>
      </dl>

      <table className="w-full border-collapse">
        <caption className="sr-only">Items</caption>
        <thead>
          <tr className="border-b border-rule text-left text-[14px] text-muted-strong">
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

      <dl className="grid grid-cols-[1fr_auto] gap-y-[4px] tabular-nums">
        <dt>Subtotal</dt>
        <dd className="text-right">{formatReceiptPeso(totals.subtotal)}</dd>
        <dt>Fee</dt>
        <dd className="text-right">{formatReceiptPeso(totals.fee)}</dd>
        <dt>
          Discount
          {payment?.discountType
            ? payment.discountType === "senior_citizen"
              ? " (Senior Citizen)"
              : payment.discountType === "pwd"
                ? " (PWD)"
                : ` (${payment.discountType})`
            : ""}
        </dt>
        <dd className="text-right">
          {totals.discount > 0 ? `−${formatReceiptPeso(totals.discount)}` : formatReceiptPeso(0)}
        </dd>
        {payment?.discountType === "senior_citizen" || payment?.discountType === "pwd" ? (
          <>
            <dt>VAT exempt</dt>
            <dd className="text-right">{formatReceiptPeso(0)}</dd>
          </>
        ) : (
          <>
            <dt>VATable sales</dt>
            <dd className="text-right">{formatReceiptPeso(totals.vatableSales)}</dd>
            <dt>VAT (12%)</dt>
            <dd className="text-right">{formatReceiptPeso(totals.vat)}</dd>
          </>
        )}
        <dt className="pt-[6px] text-[16px] font-bold">Total</dt>
        <dd className="pt-[6px] text-right text-[16px] font-bold">{formatReceiptPeso(totals.total)}</dd>
      </dl>

      {order.specialInstructions ? (
        <p className="text-muted-strong">Order note: {order.specialInstructions}</p>
      ) : null}
    </div>
  );
}
