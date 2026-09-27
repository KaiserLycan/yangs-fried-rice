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
  add_on_ids: z.array(z.string().uuid()).max(20, { message: "Too many add-ons selected" }).optional(),
});

/**
 * Changing a cart line in place. `add_on_ids`, when sent, is the line's whole
 * new set of add-ons — it replaces the line's `cart_item_add_on` rows rather
 * than adding to them, so the "Edit" dialog can untick one (limitations #23).
 * An empty array clears them; leaving it out leaves them alone.
 */
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
    add_on_ids: z
      .array(z.string().uuid({ message: "add_on_ids must be valid UUIDs" }))
      .max(20, { message: "Too many add-ons selected" })
      .optional(),
  })
  .refine(
    (data) =>
      data.quantity !== undefined ||
      data.special_instructions !== undefined ||
      data.add_on_ids !== undefined,
    { message: "At least one of quantity, special_instructions or add_on_ids must be provided for update" }
  );

/**
 * What checkout sends to `submitCart`. The shop is pickup-only (issue #114),
 * so the order is `take_out` or `dine_in`, paid by wallet or at the counter.
 * `submit_cart_to_order` enforces the same two lists in the database — this is
 * the friendlier first line, not the only one.
 *
 * `delivery_fee` is still accepted so an older client that sends it is not
 * rejected outright, but nothing reads it: the function charges no fee. A
 * `delivery_address` from an old client is dropped (unknown keys are
 * stripped); there is no address anywhere any more.
 */
export const seniorPwdDiscountSchema = z.object({
  type: z.enum(["senior_citizen", "pwd"], {
    errorMap: () => ({ message: "Choose Senior Citizen or PWD." }),
  }),
  id_number: z
    .string()
    .trim()
    .min(1, { message: "Enter the ID number." })
    .max(40, { message: "The ID number can be up to 40 characters." }),
  name_on_id: z
    .string()
    .trim()
    .min(1, { message: "Enter the name on the ID." })
    .max(100, { message: "The name can be up to 100 characters." }),
  photo_path: z.string().min(1, { message: "Add a photo of the ID." }),
});

export type SeniorPwdDiscountInput = z.infer<typeof seniorPwdDiscountSchema>;

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
    /** Which wallet, when `payment_method` is `wallet`. Saved on the transaction. */
    wallet: z
      .enum(["gcash", "paymaya"], {
        errorMap: () => ({ message: "wallet must be gcash or paymaya" }),
      })
      .default("gcash"),
    /**
     * Senior Citizen / PWD discount (issue #116). One ID per order.
     * `photo_path` is where the browser uploaded the ID photo in the private
     * `senior-pwd-ids` bucket; `submit_cart_to_order` checks it is the
     * customer's own, and repeats every rule below.
     */
    discount: seniorPwdDiscountSchema.nullable().optional(),
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
