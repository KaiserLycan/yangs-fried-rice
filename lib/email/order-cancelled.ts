import { escapeHtml } from "@/lib/email/send-email";
import { formatReceiptPeso } from "@/lib/orders/receipt";
import { isPaidStatus, isWalletMethod } from "@/lib/orders/payment";
import { PICKUP_COUNTER, SITE_BRANCH, SITE_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site/site-info";

/**
 * The "your order was cancelled" email (panel feedback F23, issue #118):
 * the reason, and — when money was already taken — what happens to it (F8).
 *
 * Pure, so the wording is tested without sending anything; the sending is
 * `lib/email/notify-order-cancelled.ts`.
 *
 * The refund note promises no timeline. Refunds are still done by hand
 * (`lacking.md`), and a date the store then misses is worse than none.
 */
export type OrderCancelledEmailInput = {
  firstName: string | null;
  orderNumber: string;
  reason: string | null;
  /** Who cancelled: the wording differs, the refund note does not. */
  cancelledBy: "store" | "customer";
  payment: { method: string | null; status: string | null; amount: number } | null;
};

export function refundNoteFor(payment: OrderCancelledEmailInput["payment"]): string | null {
  if (!payment || !isPaidStatus(payment.status) || payment.amount <= 0) return null;
  const amount = formatReceiptPeso(payment.amount);
  return isWalletMethod(payment.method)
    ? `You paid ${amount} by GCash / Maya. The store will refund it to the same wallet and let you know once it has been sent.`
    : `You paid ${amount} at the counter. Bring your order number to ${PICKUP_COUNTER} and the store will refund you.`;
}

function contactLine(): string {
  const ways = [SUPPORT_PHONE, SUPPORT_EMAIL].filter(Boolean);
  return ways.length > 0
    ? `Questions? Contact us at ${ways.join(" or ")}, or ask at ${PICKUP_COUNTER}.`
    : `Questions? Ask us at ${PICKUP_COUNTER}, ${SITE_BRANCH}.`;
}

export function orderCancelledEmail(input: OrderCancelledEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const reference = `#${input.orderNumber}`;
  const greeting = input.firstName?.trim() ? `Hi ${input.firstName.trim()},` : "Hi,";
  const opening =
    input.cancelledBy === "store"
      ? `We're sorry — we had to cancel your order ${reference}.`
      : `Your order ${reference} has been cancelled, as you asked.`;
  const reason = input.reason?.trim() || null;
  const refund = refundNoteFor(input.payment);
  const closing = "You can place a new order from the menu any time.";

  const textLines = [
    greeting,
    "",
    opening,
    ...(reason ? [`Reason: ${reason}`] : []),
    ...(refund ? ["", refund] : []),
    "",
    closing,
    contactLine(),
    "",
    `— ${SITE_NAME}, ${SITE_BRANCH}`,
  ];

  const paragraph = (content: string) =>
    `<p style="margin:0 0 14px;font-size:16px;line-height:24px;color:#1a1210">${content}</p>`;

  const html = [
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px">`,
    paragraph(escapeHtml(greeting)),
    paragraph(escapeHtml(opening)),
    reason ? paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`) : "",
    refund
      ? `<p style="margin:0 0 14px;padding:12px 14px;border-radius:8px;background:#FFF7E8;font-size:16px;line-height:24px;color:#1a1210">${escapeHtml(refund)}</p>`
      : "",
    paragraph(escapeHtml(closing)),
    paragraph(escapeHtml(contactLine())),
    `<p style="margin:24px 0 0;font-size:14px;color:#5E5048">${escapeHtml(`${SITE_NAME}, ${SITE_BRANCH}`)}</p>`,
    `</div>`,
  ].join("");

  return {
    subject: `Order ${reference} was cancelled`,
    html,
    text: textLines.join("\n"),
  };
}
