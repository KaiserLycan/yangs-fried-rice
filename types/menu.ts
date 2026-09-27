/**
 * A dish as the back office's menu screen draws and edits it
 * (`app/manage/menu/page.tsx`, `components/manage/menu/*`).
 *
 * Moved here from `components/manage/menu/mock-menu.ts` (issue #118), along
 * with dropping the mock dishes and the hard-coded category list that sat
 * beside it. Categories come from the `categories` table, so a category is
 * any name the manager has created — not a fixed union.
 */

export type MenuCategory = string;

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Average of the dish's reviews, 0 when it has none. */
  rating: number;
  category: MenuCategory;
  image: string;
  /** The "Available?" toggle — `product.is_available`. */
  available: boolean;
  add_ons?: { addon_id: string; name: string; price: number }[];
  reviews?: { id: string; rating: number; comment: string; customerName: string; createdAt: string }[];
}
