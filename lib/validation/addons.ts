import { z } from "zod";

/**
 * Schema for creating a new add-on on a product.
 * Body: { name: string, price: number }
 */
export const addonSchema = z.object({
  name: z
    .string({ required_error: "Add-on name is required" })
    .min(1, "Add-on name must not be empty")
    .max(100, "Add-on name must be at most 100 characters"),
  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be greater than 0"),
});

/**
 * Schema for updating an existing add-on.
 * All fields optional — only provided fields are updated.
 */
export const addonUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Add-on name must not be empty")
      .max(100, "Add-on name must be at most 100 characters")
      .optional(),
    price: z.number().positive("Price must be greater than 0").optional(),
  })
  .refine((data) => data.name !== undefined || data.price !== undefined, {
    message: "At least one field (name or price) must be provided",
  });

export type AddonInput = z.infer<typeof addonSchema>;
export type AddonUpdateInput = z.infer<typeof addonUpdateSchema>;
