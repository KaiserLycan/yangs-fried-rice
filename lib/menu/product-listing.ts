/**
 * The shape the menu screen actually needs, mapped once from whatever
 * `GET /api/menu/products` and `getProducts()` return.
 *
 * Both of those return the raw `product` row joined with its category's
 * name, which is a database shape (snake_case columns, a nested
 * `categories` object, a nullable `is_available`) rather than a screen
 * shape. Mapping it here, in one place, is what stops that database shape
 * leaking into every component that renders a dish.
 */
export type ProductListing = {
  id: string;
  name: string;
  /** The frame calls this the description; the column is `product_details`. */
  description: string;
  /** Pesos, as stored — formatting for display is `formatPeso`'s job. */
  price: number;
  categoryName: string | null;
  /**
   * `is_available` is a nullable boolean with no documented default, so
   * "hidden" has to be an explicit `false` — a customer should not lose a
   * dish off the menu because the column came back empty rather than
   * because someone actually marked it unavailable.
   */
  isAvailable: boolean;
  imageUrl?: string | null;
};

/** What `GET /api/menu/products` and `getProducts()` both actually return. */
export type RawProductRow = {
  product_id: string;
  product_name: string;
  product_details: string | null;
  product_price: number;
  is_available: boolean | null;
  image_url?: string | null;
  categories: { category_name: string } | null;
};

export function mapProductRow(row: RawProductRow): ProductListing {
  return {
    id: row.product_id,
    name: row.product_name,
    description: row.product_details ?? "",
    price: row.product_price,
    categoryName: row.categories?.category_name ?? null,
    isAvailable: row.is_available !== false,
    imageUrl: row.image_url ?? null,
  };
}

/**
 * "₱180", not "₱180.00" — every price in the frames is a whole number of
 * pesos. Rounds rather than truncates, so a price that somehow arrives with
 * cents doesn't quietly read low.
 */
export function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-US")}`;
}
