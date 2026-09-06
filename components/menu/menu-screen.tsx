"use client";

import * as React from "react";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { CategorySidebar } from "@/components/menu/category-sidebar";
import { CategoryChips } from "@/components/menu/category-chips";
import { ItemDetailModal } from "@/components/menu/item-detail-modal";
import { MenuEmptyState } from "@/components/menu/menu-empty-state";
import { MobileMenuHeader } from "@/components/menu/mobile-menu-header";
import { ProductCard } from "@/components/menu/product-card";
import { ProductRow } from "@/components/menu/product-row";
import { SearchField } from "@/components/menu/search-field";
import { fetchCategories, fetchProducts, type CategoryOption } from "@/lib/menu/fetch-menu";
import type { ProductListing } from "@/lib/menu/product-listing";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { createClient } from "@/lib/supabase/client";

/** Debounce for the search field, so every keystroke doesn't fire a request. */
const SEARCH_DEBOUNCE_MS = 250;

/**
 * `/menu` (`133:734` desktop, `132:88` mobile), issue #3's last acceptance
 * criterion included: the list re-renders on its own when a product or
 * category changes, no refresh needed.
 *
 * A client component because search, the selected category, and the
 * Supabase Realtime subscription all live in browser state — the initial,
 * unfiltered list is still fetched server-side by `app/(shop)/menu/page.tsx`
 * and handed in as `initialProducts`, so a customer sees dishes on first
 * paint rather than a loading state.
 */
export function MenuScreen({
  profile,
  initialProducts,
  initialCategories,
  cartCount,
}: {
  profile: CustomerProfile | null;
  initialProducts: ProductListing[];
  initialCategories: CategoryOption[];
  cartCount: number;
}) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const [products, setProducts] = React.useState(initialProducts);
  const [categories, setCategories] = React.useState(initialCategories);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductListing | null>(
    null,
  );

  const reload = React.useCallback(async () => {
    const [nextProducts, nextCategories] = await Promise.all([
      fetchProducts({ search, categoryName: selectedCategory }),
      fetchCategories(),
    ]);
    setProducts(nextProducts);
    setCategories(nextCategories);
  }, [search, selectedCategory]);

  // Search and category changes both go through the same debounced fetch —
  // typing a keyword and picking a category are the same kind of request to
  // the same route, just with different parameters.
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts({ search, categoryName: selectedCategory }).then(
        setProducts,
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory]);

  // Live menu updates (issue #3's last unticked criterion). Refetching on
  // any change is simpler and far less error-prone than patching the two
  // tables' rows into local state by hand, and a product/category table
  // changes rarely enough that the extra round trip costs nothing a
  // customer would notice.
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("menu-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product" },
        reload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        reload,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);

  const hasFilter = search.trim().length > 0 || selectedCategory !== null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavBar
        profile={profile}
        currentSection="menu"
        search={
          <SearchField value={search} onChange={setSearch} variant="nav" />
        }
      />
      <MobileMenuHeader
        profile={profile}
        search={search}
        onSearchChange={setSearch}
      />

      <CategoryChips
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="flex flex-1 md:px-[24px] md:py-0">
        <CategorySidebar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <main className="flex-1 md:px-[28px] md:py-[26px]">
          <div className="hidden items-baseline gap-[12px] px-[20px] pt-[16px] md:flex md:px-0 md:pt-0">
            <h1 className="font-display text-[32px] tracking-[0.32px] text-foreground">
              THE WHOLE MENU
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {products.length} {products.length === 1 ? "dish" : "dishes"}
            </p>
          </div>

          {products.length === 0 ? (
            <MenuEmptyState hasFilter={hasFilter} />
          ) : (
            <>
              <div className="hidden gap-[16px] pt-[24px] md:grid md:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
              <div className="flex flex-col md:hidden">
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      <BottomTabBar current="menu" cartCount={cartCount} />

      <ItemDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
