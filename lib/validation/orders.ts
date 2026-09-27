import { z } from "zod";

/**
 * Order-management validation schemas.
 *
 * Statuses and transitions live here so both the server actions and
 * future UI code share the same source of truth.
 */

// ---------------------------------------------------------------------------
// Status vocabulary
// ---------------------------------------------------------------------------

/**
 * `received` used to sit between `pending` and `preparing`, but nothing could
 * ever move an order into it (issue #118). Staff accepting an order *is*
 * `pending → preparing`, so the extra step was dropped rather than wired up.
 */
export const ORDER_STATUSES = [
  "awaiting_payment",
  "payment_failed",
  "pending",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * The two statuses that mean "nobody has paid for this and nobody should be
 * cooking it".
 *
 * A wallet order is written as `awaiting_payment` by `submitCart` and only
 * becomes `pending` — the live kitchen state — when PayMongo's webhook says
 * the money arrived, or when the customer gives up and switches to cash on
 * delivery. A payment that comes back refused lands on `payment_failed`.
 *
 * Before this existed every order was born `pending`, so an abandoned or
 * refused wallet payment went straight to the kitchen and the rider queue
 * (issue #106). Staff-facing reads filter on this list rather than naming the
 * two strings themselves, so a third payment state later only has to be added
 * here.
 */
export const UNPAID_ORDER_STATUSES = [
  "awaiting_payment",
  "payment_failed",
] as const;

/** Is this an order nobody has paid for yet? */
export function isUnpaidStatus(status: string | null | undefined): boolean {
  return (UNPAID_ORDER_STATUSES as readonly string[]).includes(status ?? "");
}

export const orderStatusSchema = z.enum(ORDER_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${ORDER_STATUSES.join(", ")}.`,
  }),
});

// ---------------------------------------------------------------------------
// Transition rules
// ---------------------------------------------------------------------------

/**
 * For every status, the set of statuses it may legally move to.
 *
 * `cancelled` is reachable from every non-terminal status.
 * `completed` and `cancelled` are terminal — no further transitions.
 *
 * The two payment gates only ever lead to `pending` (the money arrived, or
 * the customer switched to cash on delivery) or out of the system entirely.
 * Neither can jump straight to `preparing`: an unpaid order must pass through
 * `pending` so it enters the kitchen queue by the same door as every other
 * order.
 */
export const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  awaiting_payment: ["pending", "payment_failed", "cancelled"],
  payment_failed: ["pending", "cancelled"],
  // `preparing` is "staff accepted it": the kitchen has started.
  pending: ["preparing", "cancelled"],
  // Pickup-only (issue #114): nothing new goes out for delivery. The status
  // stays in the vocabulary so legacy orders already there can be finished.
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],   // terminal
  cancelled: [],   // terminal
};

/** Is it legal to move from `from` to `to`? */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Filters / query params
// ---------------------------------------------------------------------------

export const orderFilterSchema = z.object({
  status: z
    .union([orderStatusSchema, z.array(orderStatusSchema)])
    .optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  /** Start of an order id, as printed on the card — "#6940" (P52). */
  search: z.string().max(40).optional(),
  customer_name: z.string().optional(),
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  payment_method: z.string().optional(),
  /** "take_out" (also matches legacy pickup spellings) or "dine_in". */
  order_type: z.enum(["take_out", "dine_in"]).optional(),
  /**
   * The manager-only Payment Issues view: payment_failed orders, plus
   * awaiting_payment orders older than STUCK_PAYMENT_MINUTES.
   */
  payment_issues: z.boolean().optional(),
  include_unpaid: z.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type OrderFilters = z.infer<typeof orderFilterSchema>;

// ---------------------------------------------------------------------------
// Report date range
// ---------------------------------------------------------------------------

export const reportDateRangeSchema = z
  .object({
    start_date: z
      .string()
      .min(1, "Start date cannot be empty.")
      .optional()
      .default(() => new Date().toISOString().split("T")[0]),
    end_date: z
      .string()
      .min(1, "End date cannot be empty.")
      .optional()
      .default(() => new Date().toISOString().split("T")[0]),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be greater than or equal to start_date.",
    path: ["end_date"],
  });

export type ReportDateRange = z.infer<typeof reportDateRangeSchema>;

// ---------------------------------------------------------------------------
// Report frequency (grouping period for sales reports)
// ---------------------------------------------------------------------------

export const REPORT_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;

export type ReportFrequency = (typeof REPORT_FREQUENCIES)[number];

export const reportFrequencySchema = z.enum(REPORT_FREQUENCIES, {
  errorMap: () => ({
    message: `frequency must be one of: ${REPORT_FREQUENCIES.join(", ")}.`,
  }),
});

// ---------------------------------------------------------------------------
// Sales report query schema (date range + frequency)
// ---------------------------------------------------------------------------

export const salesReportQuerySchema = z
  .object({
    start_date: z
      .string()
      .min(1, "Start date cannot be empty.")
      .optional()
      .default(() => new Date().toISOString().split("T")[0]),
    end_date: z
      .string()
      .min(1, "End date cannot be empty.")
      .optional()
      .default(() => new Date().toISOString().split("T")[0]),
    frequency: reportFrequencySchema.default("daily"),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be greater than or equal to start_date.",
    path: ["end_date"],
  });

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;

// ---------------------------------------------------------------------------
// Performance report query schema (date range + top_products)
// ---------------------------------------------------------------------------

export const performanceReportQuerySchema = z
  .object({
    start_date: z
      .string()
      .min(1, "Start date cannot be empty.")
      .optional()
      .default(() => new Date().toISOString().split("T")[0]),
    end_date: z
      .string()
      .min(1, "End date cannot be empty.")
      .optional()
      .default(() => new Date().toISOString().split("T")[0]),
    top_products: z.coerce
      .number()
      .int("top_products must be an integer.")
      .min(1, "top_products must be at least 1.")
      .max(50, "top_products must be at most 50.")
      .default(5),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be greater than or equal to start_date.",
    path: ["end_date"],
  });

export type PerformanceReportQuery = z.infer<typeof performanceReportQuerySchema>;

