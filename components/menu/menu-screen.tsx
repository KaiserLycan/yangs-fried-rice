"use client";

import * as React from "react";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { CategorySidebar } from "@/components/menu/category-sidebar";
import { CategoryChips } from "@/components/menu/category-chips";
import { DesktopCartRail } from "@/components/cart/desktop-cart-rail";
import { ItemDetailModal } from "@/components/menu/item-detail-modal";
import { MenuEmptyState } from "@/components/menu/menu-empty-state";
import { MobileMenuHeader } from "@/components/menu/mobile-menu-header";
import { ProductCard } from "@/components/menu/product-card";
import { ProductRow } from "@/components/menu/product-row";
import { SearchField } from "@/components/menu/search-field";
import { useToast } from "@/components/ui/toast";
import {
  fetchCategories,
  fetchProducts,
  type CategoryOption,
} from "@/lib/menu/fetch-menu";
import { cartItemCount, type CartLine } from "@/lib/menu/cart-totals";
import type { ProductListing } from "@/lib/menu/product-listing";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { createClient } from "@/lib/supabase/client";

/** Debounce for the search field, so every keystroke doesn't fire a request. */
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Said when a refetch fails, whether it came from typing or from a live
 * update. Deliberately not "something went wrong": it names what did not
 * happen, so a customer can tell that the dishes still on screen may be out
 * of date rather than wondering what broke.
 */
const MENU_REFRESH_FAILED =
  "The menu couldn't be updated. Showing the last version we loaded.";

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
  cartLines,
}: {
  profile: CustomerProfile | null;
  initialProducts: ProductListing[];
  initialCategories: CategoryOption[];
  cartLines: CartLine[];
}) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const [products, setProducts] = React.useState(initialProducts);
  const [categories, setCategories] = React.useState(initialCategories);
  const [selectedProduct, setSelectedProduct] =
    React.useState<ProductListing | null>(null);

  const showToast = useToast();

  /**
   * The current filters, readable without being a dependency.
   *
   * The Realtime subscription below needs to know what to refetch, but it
   * must not tear itself down and rebuild every time a keystroke changes the
   * search text. Reading the filters through a ref keeps `reload` stable, so
   * the effect that owns the channel depends on nothing that changes while
   * someone is typing.
   */
  const filtersRef = React.useRef({ search, selectedCategory });
  React.useEffect(() => {
    filtersRef.current = { search, selectedCategory };
  }, [search, selectedCategory]);

  const reload = React.useCallback(async () => {
    const current = filtersRef.current;
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        fetchProducts({
          search: current.search,
          categoryName: current.selectedCategory,
        }),
        fetchCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch {
      showToast(MENU_REFRESH_FAILED);
    }
  }, [showToast]);

  // Search and category changes both go through the same debounced fetch —
  // typing a keyword and picking a category are the same kind of request to
  // the same route, just with different parameters.
  //
  // `stale` is what stops a slow request for an old keyword from landing on
  // top of a fast one for the current keyword: React runs this cleanup before
  // the next run, so any request still in flight is disowned at the moment
  // its filters stop being the current ones. Without it the list can end up
  // showing results for something the customer has already typed past.
  React.useEffect(() => {
    let stale = false;

    const timeout = setTimeout(() => {
      fetchProducts({ search, categoryName: selectedCategory })
        .then((nextProducts) => {
          if (!stale) setProducts(nextProducts);
        })
        .catch(() => {
          // A failed refresh leaves the current results up rather than
          // blanking the menu — the dishes already on screen are still the
          // best answer we have, and an empty column would read as "nothing
          // matched" rather than "the request failed".
          if (!stale) showToast(MENU_REFRESH_FAILED);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
  }, [search, selectedCategory, showToast]);

  // Live menu updates (issue #3's last unticked criterion). Refetching on
  // any change is simpler and far less error-prone than patching the two
  // tables' rows into local state by hand, and a product/category table
  // changes rarely enough that the extra round trip costs nothing a
  // customer would notice.
  //
  // `reload` is deliberately stable, so this opens one channel for the life
  // of the screen instead of closing and reopening a WebSocket on every
  // keystroke — churn that also risks dropping an event in the gap between
  // the two subscriptions.
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

      {/* No gap between these three columns — the frame (133:734) has the
          sidebar, the centre content and the cart rail sitting flush against
          each other, each with its own internal padding rather than an
          outer gap between them. */}
      {/* The foot padding is the space `BottomTabBar` used to occupy before it
          became fixed — without it the last dish in the list sits underneath
          the bar and cannot be scrolled clear of it. Mobile only, since the
          bar is `md:hidden`. */}
      <div className="flex flex-1 pb-[var(--tab-bar-height)] md:pb-0">
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

        <DesktopCartRail lines={cartLines} />
      </div>

      <BottomTabBar current="menu" cartCount={cartItemCount(cartLines)} />

      <ItemDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
