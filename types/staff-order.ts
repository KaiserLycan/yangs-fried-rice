/**
 * An order as the staff screens draw it — the Orders page cards, the order
 * detail modal and the KDS. Built from a database row by
 * `lib/orders/map-staff-order.ts`.
 *
 * Moved here from `lib/mock-orders.ts` (issue #118): this was never mock
 * data, and a real type living in a file named "mock" invited deleting it
 * along with the sample orders.
 */

/**
 * The staff board's columns, not the database vocabulary. Several database
 * statuses land in one column: `pending` → QUEUE, `ready` and legacy
 * `out_for_delivery` → DELIVERY (read as "Ready for pick up" for a pickup
 * order; see `statusLabelFor` in `lib/orders/staff-actions.ts`).
 * `awaiting_payment` and `payment_failed` → UNPAID: shown only on the
 * payment-issue views, and never confirmable until the money lands.
 */
export type StaffOrderStatus = "UNPAID" | "QUEUE" | "PREP" | "DELIVERY" | "COMPLETED" | "CANCELED";

export type OrderData = {
  id: string;
  rawCreatedAt?: string | null;
  rawReadyAt?: string | null;
  /** The database status behind `status` — tells "awaiting payment" from "payment failed" under UNPAID. */
  dbStatus?: string | null;
  paymentMethod?: string | null;
  /**
   * When the order started waiting for staff to accept it — set only while
   * it is still `pending` (issue #115). The staff screens flash a card once
   * this is 5 minutes old; `received` shares the QUEUE column but has been
   * accepted, so it has none.
   */
  pendingAt?: string | null;
  /**
   * True only for an order placed before the shop went pickup-only
   * (issue #114). Such orders still exist and still need finishing, so the
   * wording on their card differs; nothing new is ever a delivery.
   */
  isDelivery?: boolean;
  /** 'self_pickup' (default) or '3rd_party_courier'. */
  fulfillmentMethod?: string;
  orderNumber: string;
  time: string;
  status: StaffOrderStatus;
  timer?: string;
  items: {
    quantity: number;
    name: string;
    addons?: string;
    /** This line's own special instructions. */
    instructions?: string;
    price: number;
  }[];
  contactInfo: {
    name: string;
    phone: string;
  };
  orderInfo: {
    type: string;
    specialInstructions?: string;
  };
  /** 0 for every pickup order; kept for legacy delivery orders. */
  deliveryFee: number;
  /** What the customer owes — after any Senior Citizen / PWD discount. */
  total: number;
  /**
   * Set when the customer claimed the Senior Citizen / PWD discount
   * (issue #116). Staff check the ID before releasing the order.
   */
  seniorPwd?: {
    type: "senior_citizen" | "pwd";
    idNumber: string;
    nameOnId: string;
    discount: number;
    /** False once the photo is deleted (order completed or cancelled). */
    hasPhoto: boolean;
  };
};
