import type { PaymentStatus } from "@/lib/checkout/payment-status";
import type { CartLine, Fulfilment } from "@/lib/menu/cart-totals";

/**
 * One order that has just been placed, narrowed to what the confirmation
 * screen draws.
 *
 * The lines are `CartLine`s rather than a new shape on purpose: the
 * confirmation shows the same summary as checkout, computed by the same
 * `computeCartTotals`. A separate order-line type here would be a second way
 * to add up the same money.
 */
export type PlacedOrder = {
  orderId: string;
  /** The order's reference — see `lib/orders/order-number.ts`. */
  orderNumber: string;
  customerName: string;
  /** Already formatted — see `formatOrderTime` on why not a Date. */
  placedAtLabel: string;
  /** Where it is going. Null for a pickup order, which has no destination. */
  address: string | null;
  fulfilment: Fulfilment;
  lines: CartLine[];
  /** "Cash on delivery" — what they chose, not what was charged. */
  paymentMethodLabel: string;
  /**
   * Whether this order is waiting on a wallet payment, as opposed to one of
   * the pay-later methods.
   *
   * The label above cannot answer this: a cash-on-delivery order and an
   * unpaid GCash order both sit at `payment_status: "pending"`, and the
   * receipt has to treat them completely differently — one may be tracked,
   * the other must not be until the money lands (issue #106).
   */
  isWalletOrder: boolean;
  /** The order's own status, so the receipt can tell "held" from "live". */
  orderStatus: string | null;
  /** Where an online payment stands. Null when nothing was ever charged —
   * every pay-on-collection order, and a wallet order whose payment never
   * started. */
  paymentStatus: PaymentStatus | null;
};

// The helper that used to live here is now `formatOrderNumber` in
// `lib/orders/order-number.ts` — one definition for the customer, the
// kitchen, manage and the rider (issue #106).
