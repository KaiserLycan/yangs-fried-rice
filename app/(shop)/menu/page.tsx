import { MenuScreen } from "@/components/menu/menu-screen";
import { ToastProvider } from "@/components/ui/toast";
import { readCartItemCount } from "@/lib/cart/cart-count";
import { getCategories, getProducts } from "@/lib/actions/menu";
import { mapProductRow } from "@/lib/menu/product-listing";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Menu browse (Browsing1-16, SFR1-2, Menu5), public — `middleware.ts`'s
 * matcher deliberately excludes `/menu`, so this renders for a guest as well
 * as a signed-in customer. `readCustomerProfile()` returning `null` for a
 * guest is exactly the behaviour this page wants, unlike `/profile`, which
 * redirects on the same null.
 *
 * The initial, unfiltered list is fetched here with the existing
 * `getProducts()`/`getCategories()` server actions rather than this page's
 * own `GET /api/menu/products` route — reusing the read jmv0111/LleytonFlores
 * already built rather than a self-fetch for the first paint. Search and
 * category changes after that go through the API route from inside
 * `MenuScreen`, which is the interactive part of this screen.
 *
 * Reads are real; the Add to cart button on every card is not wired — that's
 * ticket 03 (`.scratch/ordering-flow/issues/03-item-detail.md`), not this
 * screen's job.
 */
export default async function MenuPage() {
  const [profile, productsResult, categoriesResult, cartCount] =
    await Promise.all([
      readCustomerProfile(),
      getProducts(),
      getCategories(),
      readCartItemCount(),
    ]);

  const initialProducts = (productsResult.data ?? []).map(mapProductRow);
  const initialCategories = (categoriesResult.data ?? []).map((category) => ({
    id: category.category_id,
    name: category.category_name,
  }));

  return (
    <ToastProvider>
      <MenuScreen
        profile={profile}
        initialProducts={initialProducts}
        initialCategories={initialCategories}
        cartCount={cartCount}
      />
    </ToastProvider>
  );
}
