import { z } from "zod";
import { isPaymentMethodAllowed } from "@/lib/checkout/payment-methods";

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

export const submitCartSchema = z.object({
  cart_id: z.string().uuid({ message: "cart_id must be a valid UUID" }),
  order_type: z.enum(["dine_in", "take_out", "delivery"], {
    errorMap: () => ({ message: "order_type must be dine_in, take_out, or delivery" }),
  }).default("take_out"),
  special_instructions: z
    .string()
    .trim()
    .max(500, { message: "special_instructions cannot exceed 500 characters" })
    .nullable()
    .optional(),
  delivery_fee: z
    .number()
    .min(0, { message: "delivery_fee must be greater than or equal to 0" })
    .optional()
    .default(0),
  delivery_address: z
    .string()
    .trim()
    .max(500, { message: "delivery_address cannot exceed 500 characters" })
    .nullable()
    .optional(),
  /**
   * How the customer said they would pay. This decides whether the new order
   * is fit to cook: a wallet order is held at `awaiting_payment` until
   * PayMongo confirms, while cash on delivery and pay in store are `pending`
   * straight away because the money is collected later by design.
   *
   * The ids match `PAYMENT_METHODS` in `lib/checkout/payment-methods.ts`.
   * Defaulting to cash on delivery keeps older callers that send no method
   * behaving exactly as they did before.
   */
  payment_method: z
    .enum(["wallet", "cash-on-delivery", "pay-in-store"], {
      errorMap: () => ({
        message:
          "payment_method must be wallet, cash-on-delivery, or pay-in-store",
      }),
    })
    .optional(),
})
  // Filled in rather than defaulted on the field, because what a caller that
  // names no method must have meant depends on the other field: cash on
  // delivery for a delivery, paying at the counter for anything collected.
  // A fixed default of cash on delivery would have made every silent
  // take-out order fail the check below.
  .transform((data) => ({
    ...data,
    payment_method:
      data.payment_method ??
      (data.order_type === "delivery" ? "cash-on-delivery" : "pay-in-store"),
  }))
  .superRefine((data, ctx) => {
    // The picker no longer offers an impossible pairing, but the picker is
    // not the only way in — `app/api/cart/submit/route.ts` passes a raw body
    // straight through. Two of the methods name the moment money changes
    // hands, and that moment only exists for one kind of order (issue #106).
    const fulfilment = data.order_type === "delivery" ? "delivery" : "pickup";
    if (isPaymentMethodAllowed(data.payment_method, fulfilment)) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payment_method"],
      message:
        data.payment_method === "cash-on-delivery"
          ? "Cash on delivery is only available for delivery orders."
          : "Pay in store is only available for pickup orders.",
    });
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
