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
 * New wallet rows name the wallet, "gcash" or "paymaya" (#116). "paymongo"
 * is an older wallet row where the wallet was not recorded. The CHECK on the
 * column allows these three plus "pay_in_store".
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
 * "gcash" / "paymaya" name the wallet (#116); an older "paymongo" row does
 * not know which one, so it reads as the option the customer picked.
 */
export function paymentLabelFor(stored: string | null | undefined): string {
  if (!stored) return "Not recorded";
  const lower = stored.trim().toLowerCase();
  if (lower === "gcash") return "GCash";
  if (lower === "paymaya") return "Maya";
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
