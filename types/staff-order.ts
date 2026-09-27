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
 */
export type StaffOrderStatus = "QUEUE" | "PREP" | "DELIVERY" | "COMPLETED" | "CANCELED";

export type OrderData = {
  id: string;
  rawCreatedAt?: string | null;
  /**
   * True only for an order placed before the shop went pickup-only
   * (issue #114). Such orders still exist and still need finishing, so the
   * wording on their card differs; nothing new is ever a delivery.
   */
  isDelivery?: boolean;
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
    /** Only ever filled for a legacy delivery order. */
    address: string;
    phone: string;
  };
  orderInfo: {
    type: string;
    specialInstructions?: string;
  };
  /** 0 for every pickup order; kept for legacy delivery orders. */
  deliveryFee: number;
  total: number;
};
