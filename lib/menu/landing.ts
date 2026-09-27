import { createClient } from "@/lib/supabase/server";

/**
 * Reads for the landing page (`app/(shop)/page.tsx`) and the menu's
 * "Best Seller" badge. Each one degrades to an empty list rather than
 * throwing: the landing page must render even when a section has nothing
 * to show.
 */

export type LandingProduct = {
  id: string;
  name: string;
  details: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryName: string | null;
};

export type CategoryTile = { id: string; name: string; imageUrl: string | null; count: number };

type ProductRow = {
  product_id: string;
  product_name: string;
  product_details: string | null;
  product_price: number;
  image_url: string | null;
  is_available: boolean;
  categories: { category_name: string } | null;
};

const PRODUCT_COLUMNS =
  "product_id, product_name, product_details, product_price, image_url, is_available, categories ( category_name )";

function toLandingProduct(row: ProductRow): LandingProduct {
  return {
    id: row.product_id,
    name: row.product_name,
    details: row.product_details,
    price: Number(row.product_price),
    imageUrl: row.image_url,
    isAvailable: row.is_available,
    categoryName: row.categories?.category_name ?? null,
  };
}

/** Product ids of the top sellers over the last 30 days (limitations L14). */
export async function readBestSellerIds(limit = 3): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("best_sellers", { p_days: 30, p_limit: limit });
  if (error || !data) return [];
  return (data as { product_id: string }[]).map((row) => row.product_id);
}

/**
 * The best sellers as full cards, most sold first. Topped up from the
 * manager's featured dishes when the last 30 days haven't sold `limit`
 * distinct dishes yet (a new shop, a quiet month).
 */
export async function readBestSellers(limit = 4): Promise<LandingProduct[]> {
  const supabase = createClient();
  const ids = await readBestSellerIds(limit);

  const ranked: LandingProduct[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("product")
      .select(PRODUCT_COLUMNS)
      .in("product_id", ids)
      .is("archived_at", null);
    const byId = new Map(((data ?? []) as unknown as ProductRow[]).map((row) => [row.product_id, row]));
    for (const id of ids) {
      const row = byId.get(id);
      if (row) ranked.push(toLandingProduct(row));
    }
  }

  if (ranked.length < limit) {
    const { data } = await supabase
      .from("product")
      .select(PRODUCT_COLUMNS)
      .is("archived_at", null)
      .order("is_featured", { ascending: false })
      .order("product_name")
      .limit(limit * 3);
    for (const row of (data ?? []) as unknown as ProductRow[]) {
      if (ranked.length >= limit) break;
      if (!ranked.some((p) => p.id === row.product_id)) ranked.push(toLandingProduct(row));
    }
  }

  return ranked;
}

/** Every category that has something on the menu, with one dish photo as its cover. */
export async function readCategoryTiles(): Promise<CategoryTile[]> {
  const supabase = createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("category_id, category_name").order("category_name"),
    supabase
      .from("product")
      .select("category_id, image_url, is_featured")
      .is("archived_at", null)
      .order("is_featured", { ascending: false }),
  ]);

  const rows = (products ?? []) as { category_id: string | null; image_url: string | null }[];
  return (categories ?? [])
    .map((category) => {
      const inCategory = rows.filter((row) => row.category_id === category.category_id);
      return {
        id: category.category_id,
        name: category.category_name,
        imageUrl: inCategory.find((row) => row.image_url)?.image_url ?? null,
        count: inCategory.length,
      };
    })
    .filter((tile) => tile.count > 0);
}
