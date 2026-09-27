import { z } from "zod";
import { MAX_QUANTITY } from "@/lib/menu/quantity";

/**
 * One dish is capped at the stepper's MAX_QUANTITY (20), not the 99 the
 * server used to allow (issue #115). `cart_item_quantity_range` in the
 * database says the same (20260928000003_tighten_quantity_cap.sql).
 */
const QUANTITY_CAP_MESSAGE = `quantity cannot exceed ${MAX_QUANTITY} per item`;

export const addCartItemSchema = z.object({
  product_id: z.string().uuid({ message: "product_id must be a valid UUID" }),
  quantity: z
    .number()
    .int({ message: "quantity must be an integer" })
    .min(1, { message: "quantity must be at least 1" })
    .max(MAX_QUANTITY, { message: QUANTITY_CAP_MESSAGE }),
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
      .max(MAX_QUANTITY, { message: QUANTITY_CAP_MESSAGE })
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
    /**
     * What each line cost on the customer's screen: cart_item_id → unit
     * price (product + that line's add-ons). `submit_cart_to_order` refuses
     * with PRICE_CHANGED, naming the dishes, if the menu now says otherwise
     * (issue #115). Optional: an older client that omits it just skips the
     * check — every line is still priced from the menu.
     */
    expected_prices: z
      .record(z.string().uuid(), z.number().nonnegative().finite())
      .optional(),
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
