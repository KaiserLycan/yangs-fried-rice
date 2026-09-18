/**
 * The four ways a customer can say they intend to pay (`133:1109` desktop,
 * `132:457` mobile), and nothing more than that.
 *
 * **Nothing here processes a payment.** No card fields, no redirect, no
 * wallet handshake — the selection is held in component state, shown back to
 * the customer, and stops there. Taking money is the backend developer's
 * work, and issue #22 scopes this phase to the choice itself.
 *
 * Cash on delivery and Pay in store sit in the same list as the two digital
 * options rather than under a "other ways to pay" fallback, which is issue
 * #22's third acceptance criterion asked for by name. The order below is the
 * order the frames draw: card and wallet on the first row, the two
 * pay-on-collection options on the second.
 *
 * `transaction.payment_method` already exists as a column, so the selected
 * id has somewhere real to land once the write is built — see
 * `docs/reference/ordering-flow-handoff.md`.
 */

export type PaymentMethodId =
  "card" | "wallet" | "cash-on-delivery" | "pay-in-store";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  // { id: "card", label: "Credit / debit card" },
  { id: "wallet", label: "GCash / Maya wallet" },
  { id: "cash-on-delivery", label: "Cash on delivery" },
  { id: "pay-in-store", label: "Pay in store" },
];

/** Cash on delivery, which is the option both frames draw as selected. */
export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "cash-on-delivery";

/**
 * Which e-wallet a "GCash / Maya wallet" customer actually holds. The picker
 * draws the two as one option (that is what the frames draw), but PayMongo
 * redirects to one wallet or the other, so the choice has to be made before
 * "Place order" fires. See `lib/checkout/paymongo.ts`.
 */
export type WalletProvider = "gcash" | "paymaya";

export const WALLET_PROVIDERS: { id: WalletProvider; label: string }[] = [
  { id: "gcash", label: "GCash" },
  { id: "paymaya", label: "Maya" },
];

export const DEFAULT_WALLET_PROVIDER: WalletProvider = "gcash";

/** Reads a `?pay=` query value back into a wallet, or null for anything else. */
export function walletFromParam(
  value: string | undefined,
): WalletProvider | null {
  return value === "gcash" || value === "paymaya" ? value : null;
}
