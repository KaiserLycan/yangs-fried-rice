import { z } from "zod";

export const addCartItemSchema = z.object({
  product_id: z.string().uuid({ message: "product_id must be a valid UUID" }),
  quantity: z
    .number()
    .int({ message: "quantity must be an integer" })
    .min(1, { message: "quantity must be at least 1" })
    .max(99, { message: "quantity cannot exceed 99 per item" }),
  special_instructions: z
    .string()
    .trim()
    .max(500, { message: "special_instructions cannot exceed 500 characters" })
    .nullable()
    .optional(),
  add_on_ids: z.array(z.string().uuid()).optional(),
});

export const updateCartItemSchema = z
  .object({
    quantity: z
      .number()
      .int({ message: "quantity must be an integer" })
      .min(1, { message: "quantity must be at least 1" })
      .max(99, { message: "quantity cannot exceed 99 per item" })
      .optional(),
    special_instructions: z
      .string()
      .trim()
      .max(500, { message: "special_instructions cannot exceed 500 characters" })
      .nullable()
      .optional(),
  })
  .refine(
    (data) => data.quantity !== undefined || data.special_instructions !== undefined,
    { message: "At least one of quantity or special_instructions must be provided for update" }
  );

/**
 * What checkout sends to `submitCart`. The shop is pickup-only (issue #114),
 * so the order is `take_out` or `dine_in`, paid by wallet or at the counter.
 * `submit_cart_to_order` enforces the same two lists in the database — this is
 * the friendlier first line, not the only one.
 *
 * `delivery_fee` and `delivery_address` are still accepted so an older client
 * that sends them is not rejected outright, but nothing reads them: the
 * function charges no fee and stores no address.
 */
export const submitCartSchema = z
  .object({
    cart_id: z.string().uuid({ message: "cart_id must be a valid UUID" }),
    order_type: z
      .enum(["dine_in", "take_out"], {
        errorMap: () => ({
          message: "We only take pickup orders (order_type must be take_out or dine_in).",
        }),
      })
      .default("take_out"),
    special_instructions: z
      .string()
      .trim()
      .max(500, { message: "special_instructions cannot exceed 500 characters" })
      .nullable()
      .optional(),
    delivery_fee: z
      .number()
      .min(0, { message: "delivery_fee must be greater than or equal to 0" })
      .optional(),
    delivery_address: z
      .string()
      .trim()
      .max(500, { message: "delivery_address cannot exceed 500 characters" })
      .nullable()
      .optional(),
    /**
     * How the customer said they would pay. A wallet order is held at
     * `awaiting_payment` until PayMongo confirms; pay in store is `pending`
     * straight away because the money is collected at the counter. The ids
     * match `PAYMENT_METHODS` in `lib/checkout/payment-methods.ts`.
     */
    payment_method: z
      .enum(["wallet", "pay-in-store"], {
        errorMap: () => ({
          message: "payment_method must be wallet or pay-in-store",
        }),
      })
      .default("pay-in-store"),
  });

export const cancelOrderSchema = z.object({
  cancellation_reason: z
    .string()
    .trim()
    .min(3, { message: "cancellation_reason must be at least 3 characters" })
    .max(300, { message: "cancellation_reason cannot exceed 300 characters" })
    .optional()
    .default("Customer requested cancellation"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type SubmitCartInput = z.infer<typeof submitCartSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
