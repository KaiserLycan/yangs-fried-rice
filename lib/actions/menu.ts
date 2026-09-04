"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  productSchema,
  productUpdateSchema,
  categorySchema,
  type ProductInput,
  type ProductUpdateInput,
  type CategoryInput,
} from "@/lib/validation/menu";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";

// Shared types

type Category = Tables<"categories">;
type Product = Tables<"product">;

// Every product row joined with its category name.
type ProductWithCategory = Product & {
  categories: { category_name: string } | null;
};

// Standardised return type for every action.
type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/* Revalidate both the admin and customer-facing menu pages so changes are reflected instantly once UI pages exist. */
function revalidateMenuPaths() {
  revalidatePath("/manage/menu");
  revalidatePath("/menu");
}

// CATEGORIES

// Fetch every category, alphabetically.
export async function getCategories(): Promise<ActionResult<Category[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("category_name");

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// Create a new category.
export async function createCategory(
  input: CategoryInput,
): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = createClient();

  const row: TablesInsert<"categories"> = {
    category_name: parsed.data.category_name,
    ...(parsed.data.category_id ? { category_id: parsed.data.category_id } : {}),
  };

  const { data, error } = await supabase
    .from("categories")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: `Category ID "${parsed.data.category_id}" already exists. Duplicate IDs are not allowed.`,
      };
    }
    return { data: null, error: error.message };
  }
  revalidateMenuPaths();
  return { data, error: null };
}

// Rename an existing category.
export async function updateCategory(
  categoryId: string,
  input: CategoryInput,
): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = createClient();

  const changes: TablesUpdate<"categories"> = {
    category_name: parsed.data.category_name,
  };

  const { data, error } = await supabase
    .from("categories")
    .update(changes)
    .eq("category_id", categoryId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  revalidateMenuPaths();
  return { data, error: null };
}

// Delete a category.
// Products referencing it will have their `category_id` set to NULL
// (Supabase FK default).
export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult<{ category_id: string }>> {
  const supabase = createClient();

  // Check if any products are still assigned to this category
  const { count, error: countError } = await supabase
    .from("product")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (countError) return { data: null, error: countError.message };

  if (count && count > 0) {
    return {
      data: null,
      error: `Cannot delete category because ${count} product${count > 1 ? "s are" : " is"} still assigned to it. Please reassign or delete the products first.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("category_id", categoryId);

  if (error) return { data: null, error: error.message };
  revalidateMenuPaths();
  return { data: { category_id: categoryId }, error: null };
}

// PRODUCTS

// Fetch every product, joined with its category name.
export async function getProducts(): Promise<
  ActionResult<ProductWithCategory[]>
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("product")
    .select("*, categories ( category_name )")
    .order("product_name");

  if (error) return { data: null, error: error.message };
  return { data: data as ProductWithCategory[], error: null };
}

// Fetch products that belong to a specific category.
export async function getProductsByCategory(
  categoryId: string,
): Promise<ActionResult<ProductWithCategory[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("product")
    .select("*, categories ( category_name )")
    .eq("category_id", categoryId)
    .order("product_name");

  if (error) return { data: null, error: error.message };
  return { data: data as ProductWithCategory[], error: null };
}

// Insert a new product.
export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = createClient();

  const row: TablesInsert<"product"> = {
    product_name: parsed.data.product_name,
    product_price: parsed.data.product_price,
    product_details: parsed.data.product_details ?? null,
    category_id: parsed.data.category_id ?? null,
    is_available: parsed.data.is_available,
    ...(parsed.data.product_id ? { product_id: parsed.data.product_id } : {}),
  };

  const { data, error } = await supabase
    .from("product")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: `Product ID "${parsed.data.product_id}" already exists. Duplicate IDs are not allowed.`,
      };
    }
    if (error.code === "23503") {
      return {
        data: null,
        error: `Category with ID "${parsed.data.category_id}" does not exist.`,
      };
    }
    return { data: null, error: error.message };
  }
  revalidateMenuPaths();
  return { data, error: null };
}

// Update an existing product. Only the fields provided will change.
export async function updateProduct(
  productId: string,
  input: ProductUpdateInput,
): Promise<ActionResult<Product>> {
  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const supabase = createClient();

  const changes: TablesUpdate<"product"> = { ...parsed.data };

  const { data, error } = await supabase
    .from("product")
    .update(changes)
    .eq("product_id", productId)
    .select()
    .single();

  if (error) {
    if (error.code === "23503") {
      return {
        data: null,
        error: `Category with ID "${parsed.data.category_id}" does not exist.`,
      };
    }
    return { data: null, error: error.message };
  }
  revalidateMenuPaths();
  return { data, error: null };
}

// Delete a product permanently.
export async function deleteProduct(
  productId: string,
): Promise<ActionResult<{ product_id: string }>> {
  const supabase = createClient();

  const { error } = await supabase
    .from("product")
    .delete()
    .eq("product_id", productId);

  if (error) return { data: null, error: error.message };
  revalidateMenuPaths();
  return { data: { product_id: productId }, error: null };
}

// Toggle product availability
export async function toggleAvailability(
  productId: string,
  isAvailable: boolean,
): Promise<ActionResult<Product>> {
  const supabase = createClient();

  const changes: TablesUpdate<"product"> = { is_available: isAvailable };

  const { data, error } = await supabase
    .from("product")
    .update(changes)
    .eq("product_id", productId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  revalidateMenuPaths();
  return { data, error: null };
}
