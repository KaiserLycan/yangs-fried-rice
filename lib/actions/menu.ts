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
import { getCurrentEmployee } from "@/lib/actions/admin";
import { canAccessManage, resolveEmployeeRole } from "@/lib/auth/roles";
import { IMAGE_BUCKETS } from "@/lib/storage/stored-image";
import { removeStoredImage } from "@/lib/storage/remove-stored-image";

// Shared types

type Category = Tables<"categories">;
type Product = Tables<"product">;

// Every product row joined with its category name.
type ProductWithCategory = Product & {
  categories: { category_name: string } | null;
  add_on?: Tables<"add_on">[];
  review?: (Tables<"review"> & { customer: { name: string; profileImage_URL: string | null } | null })[];
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

// Fetch categories and products together in a single request for the Menu page
export async function getMenuData(): Promise<
  ActionResult<{ categories: Category[]; products: ProductWithCategory[] }>
> {
  const supabase = createClient();
  
  // Parallel fetches on the server, but only one HTTP request from the client
  const [catsRes, prodsRes] = await Promise.all([
    supabase.from("categories").select("*").order("category_name"),
    // Archived products are off the menu but still in the table, so that
    // historical orders keep resolving (issue #106). Every menu read has to
    // filter them out or "delete" looks broken.
    supabase
      .from("product")
      .select("*, categories ( category_name ), add_on ( * )")
      .is("archived_at", null)
      .order("product_name")
  ]);

  if (catsRes.error) return { data: null, error: catsRes.error.message };
  if (prodsRes.error) return { data: null, error: prodsRes.error.message };

  return {
    data: { 
      categories: catsRes.data, 
      products: prodsRes.data as ProductWithCategory[] 
    },
    error: null,
  };
}

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
    .select("*, categories ( category_name ), add_on ( * )")
    .is("archived_at", null)
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
    .select("*, categories ( category_name ), add_on ( * )")
    .eq("category_id", categoryId)
    .is("archived_at", null)
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
    image_url: parsed.data.image_url ?? null,
    ...(parsed.data.product_id ? { product_id: parsed.data.product_id } : {}),
  } as any;

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

  // Read the image being replaced *before* the update, so it can be removed
  // once the new one is saved. Every edit uploads a fresh file under a new
  // name, and without this the old one stayed in the bucket forever.
  let previousImageUrl: string | null = null;
  if (changes.image_url !== undefined) {
    const { data: before } = await supabase
      .from("product")
      .select("image_url")
      .eq("product_id", productId)
      .maybeSingle();
    previousImageUrl = before?.image_url ?? null;
  }

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
  if (previousImageUrl && previousImageUrl !== data.image_url) {
    await removeStoredImage(IMAGE_BUCKETS.menu, previousImageUrl);
  }
  revalidateMenuPaths();
  return { data, error: null };
}

/**
 * Take a product off the menu.
 *
 * Archives rather than deletes. A hard DELETE nulled `order_item.product_id`
 * on every historical line that referenced it — the foreign key is ON DELETE
 * SET NULL — so past orders lost the name of what was bought and started
 * rendering as "Unknown item" in KDS and the rider queue (issue #106).
 *
 * Orders also carry their own name and price snapshot now, so history would
 * survive a delete; archiving is the second half, keeping the row itself
 * around for anything that still joins to it. Menu reads filter on
 * `archived_at`, so an archived product disappears from the menu exactly as a
 * deleted one did.
 *
 * `is_available` is NOT the same thing: that is a temporary "we've run out"
 * flag the kitchen flips back.
 *
 * The photo does not survive the archive. Only the menu listing reads
 * `image_url`, and it skips archived rows, so the file would be unreachable
 * storage the bucket pays for indefinitely. The column is cleared with it so
 * no row is left pointing at a deleted object.
 */
export async function deleteProduct(
  productId: string,
): Promise<ActionResult<{ product_id: string }>> {
  const supabase = createClient();

  const { data: before } = await supabase
    .from("product")
    .select("image_url")
    .eq("product_id", productId)
    .maybeSingle();

  const { error } = await supabase
    .from("product")
    .update({
      archived_at: new Date().toISOString(),
      is_available: false,
      image_url: null,
    })
    .eq("product_id", productId);

  if (error) return { data: null, error: error.message };
  await removeStoredImage(IMAGE_BUCKETS.menu, before?.image_url);
  revalidateMenuPaths();
  return { data: { product_id: productId }, error: null };
}

/**
 * Remove a menu photo that was uploaded but never saved to a product — the
 * product insert or update failed after the browser had already put the
 * file in the bucket.
 *
 * Callable from the browser, so it checks two things before touching the
 * service role: the caller works the menu (manager or staff), and no product
 * row references the URL. The second check is what stops this being a way
 * to delete a live menu photo by passing its URL.
 */
export async function discardUnsavedMenuImage(
  imageUrl: string,
): Promise<ActionResult<null>> {
  const caller = await getCurrentEmployee();
  const role = caller.data ? resolveEmployeeRole(caller.data.role) : null;
  if (!role || !canAccessManage(role)) {
    return { data: null, error: "You do not have permission to do that." };
  }

  const supabase = createClient();
  const { count, error } = await supabase
    .from("product")
    .select("product_id", { count: "exact", head: true })
    .eq("image_url", imageUrl);
  if (error) return { data: null, error: error.message };
  if ((count ?? 0) > 0) return { data: null, error: null };

  await removeStoredImage(IMAGE_BUCKETS.menu, imageUrl);
  return { data: null, error: null };
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

// ADD-ONS

export async function createAddOn(
  productId: string,
  name: string,
  price: number
): Promise<ActionResult<Tables<"add_on">>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("add_on")
    .insert({ product_id: productId, name, price })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  revalidateMenuPaths();
  return { data, error: null };
}

export async function updateAddOn(
  addonId: string,
  name: string,
  price: number
): Promise<ActionResult<Tables<"add_on">>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("add_on")
    .update({ name, price })
    .eq("addon_id", addonId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  revalidateMenuPaths();
  return { data, error: null };
}

export async function deleteAddOn(
  addonId: string
): Promise<ActionResult<{ addon_id: string }>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("add_on")
    .delete()
    .eq("addon_id", addonId);

  if (error) return { data: null, error: error.message };
  revalidateMenuPaths();
  return { data: { addon_id: addonId }, error: null };
}
