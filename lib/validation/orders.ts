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

export const ORDER_STATUSES = [
  "received",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

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
 */
export const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],   // terminal
  cancelled: [],   // terminal
};

/** Is it legal to move from `from` to `to`? */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Filters / query params
// ---------------------------------------------------------------------------

export const orderFilterSchema = z.object({
  status: orderStatusSchema.optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
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

