import { z } from "zod";

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
    .enum(["pending", "paid", "failed", "refunded"], {
      errorMap: () => ({
        message:
          "Payment status must be one of: pending, paid, failed, refunded",
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
  payment_status: z.enum(["pending", "paid", "failed", "refunded"], {
    errorMap: () => ({
      message:
        "Payment status must be one of: pending, paid, failed, refunded",
    }),
  }),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
