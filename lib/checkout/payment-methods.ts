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
  { id: "card", label: "Credit / debit card" },
  { id: "wallet", label: "GCash / Maya wallet" },
  { id: "cash-on-delivery", label: "Cash on delivery" },
  { id: "pay-in-store", label: "Pay in store" },
];

/** Cash on delivery, which is the option both frames draw as selected. */
export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "cash-on-delivery";
