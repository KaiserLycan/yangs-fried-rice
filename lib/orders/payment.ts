import { PAYMENT_METHODS } from "@/lib/checkout/payment-methods";

/**
 * How a stored `transaction.payment_method` reads to a person, and whether it
 * was a wallet payment. Shared by the order-placed screen, the printable
 * receipt and the cancellation email, so the three can't name the same
 * payment differently.
 *
 * Moved out of `lib/checkout/read-placed-order.ts` (issue #118), which is
 * server-only and could not be imported by the receipt.
 */

/**
 * Does this transaction row describe a wallet payment?
 *
 * `submitCart` writes "paymongo" for a wallet order and
 * `create-payment-intent` writes the same, so that is the value in practice.
 * "gcash" and "paymaya" are accepted too because `payment_method` is free
 * text and older rows may name the wallet rather than the gateway — reading
 * one of those as a cash order would hand the customer a Track link for
 * food nobody has paid for.
 */
export function isWalletMethod(stored: string | null | undefined): boolean {
  if (!stored) return false;
  const folded = stored.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return folded === "paymongo" || folded === "gcash" || folded === "paymaya";
}

/**
 * `transaction.payment_method` is free text, so a stored value is matched
 * against the options the picker offers and otherwise shown as written.
 * Saying "Payment method not recorded" when the customer definitely chose one
 * would be worse than echoing an unfamiliar string.
 *
 * `create-payment-intent` writes the gateway's name, "paymongo", rather than
 * which wallet was used — the intent allows any of them. It is shown as the
 * option the customer picked.
 */
export function paymentLabelFor(stored: string | null | undefined): string {
  if (!stored) return "Not recorded";
  if (isWalletMethod(stored)) return "GCash / Maya wallet";
  const folded = stored
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (folded === "cash") return "Cash";
  const known = PAYMENT_METHODS.find(
    (method) =>
      method.id === folded ||
      method.label.toLowerCase() === stored.trim().toLowerCase(),
  );
  return known?.label ?? stored;
}

/** Has money actually been taken? `payment_status` is free text too. */
export function isPaidStatus(status: string | null | undefined): boolean {
  const folded = (status ?? "").trim().toLowerCase();
  return folded === "paid" || folded === "completed";
}
