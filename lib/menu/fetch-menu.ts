import { mapProductRow, type ProductListing, type RawProductRow } from "./product-listing";

/**
 * Client-side reads for the menu screen's search and category filtering.
 *
 * Both routes already exist — `GET /api/menu/products` and
 * `GET /api/menu/categories` were delivered server-side (see
 * `app/api/routers/products.ts` and `categories.ts`). This file is only the
 * thin client-side wiring onto them: building new read plumbing here would
 * duplicate work already done.
 */

export type CategoryOption = { id: string; name: string };

/**
 * `category` is sent as the category's *name*, not its id — that's what the
 * route's own comment documents (`?category=<name>`, comma-separated for
 * multi-select), because it filters with `ilike` against
 * `categories.category_name` rather than joining on the id.
 */
export async function fetchProducts({
  search,
  categoryName,
}: {
  search: string;
  categoryName: string | null;
}): Promise<ProductListing[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (categoryName) params.set("category", categoryName);

  const response = await fetch(`/api/menu/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Fetching the menu failed (${response.status}).`);
  }

  const { data } = (await response.json()) as { data: RawProductRow[] };
  return data.map(mapProductRow);
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const response = await fetch("/api/menu/categories");
  if (!response.ok) {
    throw new Error(`Fetching categories failed (${response.status}).`);
  }

  const { data } = (await response.json()) as {
    data: { category_id: string; category_name: string }[];
  };
  return data.map((row) => ({ id: row.category_id, name: row.category_name }));
}
