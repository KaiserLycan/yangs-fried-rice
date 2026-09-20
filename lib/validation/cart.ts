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
