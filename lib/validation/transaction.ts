import { z } from "zod";

/**
 * `transaction.payment_status` values. The two refund states are issue
 * #115's: `refund_pending` is set by the database when a paid wallet order
 * is cancelled, and `process-refunds` moves it to `refunded`, or to
 * `refund_failed` for a manager to settle by hand (who may then mark it
 * `refunded` through the transactions API).
 */
export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "refund_pending",
  "refund_failed",
] as const;

/**
 * Schema for creating a new transaction record.
 */
export const transactionSchema = z.object({
  order_id: z
    .string({ required_error: "Order ID is required" })
    .uuid("Order ID must be a valid UUID"),
  // Matches the CHECK on transaction.payment_method. `paymongo` only exists
  // on old wallet rows, so new ones must name the wallet.
  payment_method: z.enum(["pay_in_store", "gcash", "paymaya"], {
    errorMap: () => ({
      message: "Payment method must be one of: pay_in_store, gcash, paymaya",
    }),
  }),
  payment_status: z
    .enum(PAYMENT_STATUSES, {
      errorMap: () => ({
        message:
          `Payment status must be one of: ${PAYMENT_STATUSES.join(", ")}`,
      }),
    })
    .default("pending"),
  subtotal: z
    .number({ required_error: "Subtotal is required" })
    .nonnegative("Subtotal must be 0 or greater"),
  tax_amount: z.number().nonnegative("Tax amount must be 0 or greater").default(0),
  discount_amount: z
    .number()
    .nonnegative("Discount amount must be 0 or greater")
    .default(0),
  discount_type: z.string().nullable().optional(),
  discount_id_number: z.string().nullable().optional(),
  total_paid: z
    .number({ required_error: "Total paid is required" })
    .nonnegative("Total paid must be 0 or greater"),
  transaction_type: z.string().nullable().optional(),
});

/**
 * Schema for updating a transaction's payment status.
 */
export const transactionUpdateSchema = z.object({
  payment_status: z.enum(PAYMENT_STATUSES, {
    errorMap: () => ({
      message:
        `Payment status must be one of: ${PAYMENT_STATUSES.join(", ")}`,
    }),
  }),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
