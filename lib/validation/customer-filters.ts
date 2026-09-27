import { z } from "zod";

/**
 * The Customers page's advanced filters. Each one becomes an argument of
 * `get_customer_stats` (20260929000001), which filters in SQL — nothing here
 * is pasted into a PostgREST filter string.
 *
 * Dates are calendar days ("2026-09-01"), read as Manila days by the database.
 */
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Dates must look like 2026-09-01." });

export const CUSTOMER_ACTIVITY = ["any", "ordered", "not_ordered"] as const;
export type CustomerActivity = (typeof CUSTOMER_ACTIVITY)[number];

export const customerFiltersSchema = z
  .object({
    /** Orders and Spent count only completed orders placed in this period. */
    from: day.optional(),
    to: day.optional(),
    minOrders: z.coerce.number().int().min(0).max(100000).optional(),
    minSpent: z.coerce.number().min(0).max(100000000).optional(),
    joinedFrom: day.optional(),
    joinedTo: day.optional(),
    /** Within the period: completed at least one order / completed none. */
    activity: z.enum(CUSTOMER_ACTIVITY).optional(),
  })
  .refine((f) => !(f.from && f.to && f.to < f.from), {
    message: "The period ends before it starts.",
    path: ["to"],
  })
  .refine((f) => !(f.joinedFrom && f.joinedTo && f.joinedTo < f.joinedFrom), {
    message: "The joined range ends before it starts.",
    path: ["joinedTo"],
  });

export type CustomerFilters = z.infer<typeof customerFiltersSchema>;

/** How many filters are switched on — for the badge on the Filter button. */
export function activeCustomerFilterCount(filters: CustomerFilters): number {
  let count = 0;
  if (filters.from || filters.to) count++;
  if (filters.minOrders !== undefined) count++;
  if (filters.minSpent !== undefined) count++;
  if (filters.joinedFrom || filters.joinedTo) count++;
  if (filters.activity && filters.activity !== "any") count++;
  return count;
}
