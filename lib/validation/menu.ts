import { z } from "zod";

// Product validation

export const productSchema = z.object({
  product_id: z
    .string()
    .uuid("Product ID must be a valid UUID (e.g. 11111111-1111-1111-1111-111111111111)")
    .optional(),
  product_name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name must be 200 characters or fewer"),
  product_price: z
    .number()
    .positive("Price must be greater than 0")
    .max(99999.99, "Price cannot exceed 99,999.99"),
  product_details: z
    .string()
    .trim()
    .max(1000, "Details must be 1,000 characters or fewer")
    .nullable()
    .optional(),
  category_id: z
    .string()
    .uuid("Invalid category ID")
    .nullable()
    .optional(),
  is_available: z.boolean().optional().default(true),
});

/** Partial version of productSchema. every field is optional so callers
 *  can send only the columns they want to change. */
export const productUpdateSchema = productSchema.partial();

// Category validation

export const categorySchema = z.object({
  category_id: z
    .string()
    .uuid("Category ID must be a valid UUID")
    .optional(),
  category_name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or fewer"),
});

// Inferred TypeScript types

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
