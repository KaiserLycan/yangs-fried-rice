"use client";

import * as React from "react";
import { Suspense, useEffect, useState } from "react";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { CategorySidebar } from "@/components/menu/category-sidebar";
import { CategoryChips } from "@/components/menu/category-chips";
import { DesktopCartRail } from "@/components/cart/desktop-cart-rail";
import { ItemDetailModal } from "@/components/menu/item-detail-modal";
import { MenuEmptyState } from "@/components/menu/menu-empty-state";
import { MobileMenuHeader } from "@/components/menu/mobile-menu-header";
import { OrderAgainRow } from "@/components/menu/order-again-row";

import { ProductCard } from "@/components/menu/product-card";
import { ProductRow } from "@/components/menu/product-row";
import { SearchField } from "@/components/menu/search-field";
import { useToast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import {
  fetchCategories,
  fetchProducts,
  type CategoryOption,
} from "@/lib/menu/fetch-menu";
import {
  cartItemCount,
  type CartLine,
  type Fulfilment,
} from "@/lib/menu/cart-totals";
import type { ProductListing } from "@/lib/menu/product-listing";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import type { CartRead } from "@/lib/cart/read-cart";
import type { RecentOrder } from "@/lib/orders/read-recent-orders";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/channel-name";
import { useStoreStatus } from "@/lib/hooks/use-store-status";
import { BUSY_MESSAGE, formatStoreHours } from "@/lib/store/store-status";

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

export function MenuScreen({
  profilePromise,
  productsPromise,
  categoriesPromise,
  cartPromise,
  arrivalEstimatePromise,
  initialFulfilment,
  recentOrdersPromise,
  initialItemId = null,
}: {
  profilePromise: Promise<CustomerProfile | null>;
  productsPromise: Promise<ProductListing[]>;
  categoriesPromise: Promise<CategoryOption[]>;
  cartPromise: Promise<CartRead>;
  /**
   * The window the cart rail quotes, read from the live kitchen queue
   * (issue #106). A promise like the rest, so the menu paints without
   * waiting on a count that only the rail needs.
   */
  arrivalEstimatePromise: Promise<string | null>;
  initialFulfilment?: Fulfilment;
  /** The "Order again" row (issue #118). Resolves empty for a guest. */
  recentOrdersPromise?: Promise<RecentOrder[]>;
  /** Open this dish once the menu has loaded (`?item=`, after signing in). */
  initialItemId?: string | null;
}) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  
  // Client-fetched products/categories when filters change or live updates happen
  const [products, setProducts] = React.useState<ProductListing[] | null>(null);
  const [categories, setCategories] = React.useState<CategoryOption[] | null>(null);
  const [selectedProduct, setSelectedProduct] =
    React.useState<ProductListing | null>(null);

  // Back from "Sign in to order": reopen the dish they were on. Once only,
  // and the `?item=` is dropped so a refresh doesn't pop it open again.
  React.useEffect(() => {
    if (!initialItemId) return;
    let active = true;
    Promise.resolve(productsPromise)
      .then((list) => {
        const match = list.find((product) => product.id === initialItemId);
        if (!active || !match) return;
        setSelectedProduct(match);
        const url = new URL(window.location.href);
        url.searchParams.delete("item");
        window.history.replaceState(null, "", url.pathname + url.search);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialItemId, productsPromise]);

  const [optimisticCartLines, setOptimisticCartLines] = React.useState<CartLine[] | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const showToast = useToast();

  // Guests see "Sign in to order" in place of Add (panel F3). Until the
  // profile has resolved nobody is treated as a guest, so a signed-in
  // customer never sees the guest button flash first.
  const [isGuest, setIsGuest] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    // A promise passed from a Server Component arrives as React's Flight
    // chunk, whose `.then()` returns undefined — chaining `.catch` on it
    // throws. Promise.resolve adopts it into a real promise first.
    Promise.resolve(profilePromise)
      .then((profile) => {
        if (active) setIsGuest(profile === null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [profilePromise]);

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

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let stale = false;
    setIsPending(true);

    const timeout = setTimeout(() => {
      fetchProducts({ search, categoryName: selectedCategory })
        .then((nextProducts) => {
          if (!stale) {
            setProducts(nextProducts);
            setIsPending(false);
          }
        })
        .catch(() => {
          if (!stale) {
            showToast(MENU_REFRESH_FAILED);
            setIsPending(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timeout);
    };
  }, [search, selectedCategory, showToast]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(uniqueChannelName("menu-changes"))
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

  // Open / paused / busy, from the database's hours and the manager's pause
  // (issue #115). Null until the first answer, so no banner flashes on load.
  const storeStatus = useStoreStatus();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNavBar
        profilePromise={profilePromise}
        currentSection="menu"
        search={
          <SearchField value={search} onChange={setSearch} variant="nav" />
        }
      />
      <MobileMenuHeader
        profilePromise={profilePromise}
        search={search}
        onSearchChange={setSearch}
      />
      
      {storeStatus && !storeStatus.isOpen ? (
        <Alert className="rounded-none border-x-0 border-t-0 flex items-center justify-center">
          Store is currently closed. Restaurant hours are {formatStoreHours(storeStatus)}.
        </Alert>
      ) : storeStatus && (storeStatus.isPaused || storeStatus.isBusy) ? (
        <Alert className="rounded-none border-x-0 border-t-0 flex items-center justify-center">
          {BUSY_MESSAGE}
        </Alert>
      ) : null}

      {categories ? (
        <CategoryChips
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      ) : (
        <Suspense fallback={
          <div className="flex gap-[8px] overflow-x-hidden px-[16px] py-[12px] md:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[32px] w-[80px] shrink-0 animate-pulse rounded-full bg-secondary/40" />
            ))}
          </div>
        }>
          <ResolvedCategoryChips 
            categoriesPromise={categoriesPromise} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </Suspense>
      )}

      <div className="flex flex-1 pb-[var(--tab-bar-height)] md:pb-0">
        {categories ? (
          <CategorySidebar
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        ) : (
          <Suspense fallback={
            <aside className="hidden w-[208px] shrink-0 flex-col md:flex">
              <h2 className="px-[18px] pt-[24px] text-sm font-bold uppercase tracking-[0.5px] text-foreground">
                Categories
              </h2>
              <nav className="mt-[15px] flex flex-col gap-[6px] px-[18px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[38px] w-full animate-pulse rounded-md bg-secondary/40" />
                ))}
              </nav>
            </aside>
          }>
            <ResolvedCategorySidebar 
              categoriesPromise={categoriesPromise} 
              selected={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </Suspense>
        )}

        <main className="flex-1 md:px-[28px] md:py-[26px]">
          {/* Only on the unfiltered menu: searching means they are after
              something else. */}
          {recentOrdersPromise && !hasFilter ? (
            <div className="md:mb-[24px]">
              <OrderAgainRow ordersPromise={recentOrdersPromise} />
            </div>
          ) : null}

          <div className="hidden items-baseline gap-[12px] px-[20px] pt-[16px] md:flex md:px-0 md:pt-0">
            <h1 className="font-display text-3xl uppercase tracking-[0.32px] text-foreground">
              {selectedCategory ?? "THE WHOLE MENU"}
            </h1>
          </div>

          {isPending ? (
            <GridSkeleton />
          ) : products ? (
            products.length === 0 ? (
              <MenuEmptyState hasFilter={hasFilter} />
            ) : (
              <>
                <div className="hidden gap-[16px] pt-[24px] md:grid md:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} isGuest={isGuest} />
                  ))}
                </div>
                <div className="flex flex-col md:hidden">
                  {products.map((product) => (
                    <ProductRow key={product.id} product={product} onSelect={setSelectedProduct} />
                  ))}
                </div>
              </>
            )
          ) : (
            <Suspense fallback={<GridSkeleton />}>
              <ResolvedProductGrid 
                productsPromise={productsPromise} 
                onSelect={setSelectedProduct} 
                isGuest={isGuest}
              />
            </Suspense>
          )}
        </main>

        <Suspense fallback={
          <aside className="sticky top-0 hidden h-[calc(100vh-58px)] w-[328px] shrink-0 flex-col gap-[14px] self-start border-l border-field-border bg-secondary/20 px-[22px] py-[24px] md:flex">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl text-foreground">YOUR CART</h2>
              <div className="h-[16px] w-16 animate-pulse rounded-sm bg-secondary/40" />
            </div>
            <div className="flex flex-col gap-[10px]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-[7px] rounded-md border border-field-border bg-card p-[11px]">
                  <div className="flex justify-between">
                    <div className="h-[18px] w-1/2 animate-pulse rounded-sm bg-secondary/40" />
                    <div className="h-[18px] w-12 animate-pulse rounded-sm bg-secondary/40" />
                  </div>
                  <div className="mt-2 h-[27px] w-[90px] animate-pulse rounded-sm bg-secondary/40" />
                </div>
              ))}
            </div>
          </aside>
        }>
          <ResolvedCartRail 
            cartPromise={cartPromise} 
            arrivalEstimatePromise={arrivalEstimatePromise}
            optimisticCartLines={optimisticCartLines}
            setOptimisticCartLines={setOptimisticCartLines}
            initialFulfilment={initialFulfilment}
          />
        </Suspense>
      </div>

      <Suspense fallback={
        <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--tab-bar-height)] items-center justify-around border-t border-field-border bg-card md:hidden">
          {[{ id: "menu", icon: "☰", label: "Menu" }, { id: "cart", icon: "▤", label: "Cart" }, { id: "orders", icon: "◉", label: "Orders" }, { id: "account", icon: "☺", label: "Me" }].map(({ id, icon, label }) => (
            <div key={id} className={`flex flex-col items-center gap-[4px] px-[8px] py-[4px] ${id === "menu" ? "text-primary" : "text-muted-foreground"}`}>
              <span className="text-lg leading-none" aria-hidden="true">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </nav>
      }>
        <ResolvedBottomTabBar 
          cartPromise={cartPromise} 
          optimisticCartLines={optimisticCartLines} 
        />
      </Suspense>

      <ItemDetailModal
        product={selectedProduct}
        isGuest={isGuest}
        cartTotalItems={(optimisticCartLines ?? []).reduce((acc, line) => acc + line.quantity, 0)}
        cartProductItems={(optimisticCartLines ?? []).filter(l => l.name === selectedProduct?.name).reduce((acc, line) => acc + line.quantity, 0)}
        onClose={() => setSelectedProduct(null)}
        onAdd={(quantity, instructions) => {
          if (!selectedProduct) return;
          setOptimisticCartLines((prev) => {
            const currentLines = prev ?? [];
            const inst = instructions || null;
            const matchIndex = currentLines.findIndex(
              (l) => l.name === selectedProduct.name && l.specialInstructions === inst
            );
            if (matchIndex >= 0) {
              const next = [...currentLines];
              next[matchIndex] = { ...next[matchIndex], quantity: next[matchIndex].quantity + quantity };
              return next;
            }
            return [
              ...currentLines,
              {
                id: `optimistic-${Date.now()}`,
                name: selectedProduct.name,
                unitPrice: selectedProduct.price,
                quantity,
                specialInstructions: inst,
              },
            ];
          });
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component-Level Stream Wrappers
// -----------------------------------------------------------------------------

function GridSkeleton() {
  return (
    <>
      <div className="hidden gap-[16px] pt-[24px] md:grid md:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-md border border-field-border bg-card">
            <div className="h-[138px] w-full animate-pulse bg-secondary/40" />
            <div className="flex flex-1 flex-col gap-[10px] p-[14px]">
              <div className="h-[20px] w-3/4 animate-pulse rounded-sm bg-secondary/40" />
              <div className="h-[14px] w-full animate-pulse rounded-sm bg-secondary/40" />
              <div className="h-[14px] w-2/3 animate-pulse rounded-sm bg-secondary/40" />
              <div className="mt-auto flex items-center justify-between pt-[4px]">
                <div className="h-[24px] w-[60px] animate-pulse rounded-sm bg-secondary/40" />
                <div className="h-[36px] w-[60px] animate-pulse rounded-md bg-secondary/40" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col md:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-[13px] border-b border-field-border px-[20px] py-[12px] last:border-b-0">
            <div className="size-[74px] shrink-0 animate-pulse rounded-md bg-secondary/40" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-[6px]">
              <div className="h-[20px] w-3/4 animate-pulse rounded-sm bg-secondary/40" />
              <div className="h-[14px] w-full animate-pulse rounded-sm bg-secondary/40" />
              <div className="h-[14px] w-2/3 animate-pulse rounded-sm bg-secondary/40" />
              <div className="mt-[2px] h-[22px] w-[50px] animate-pulse rounded-sm bg-secondary/40" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ResolvedCategoryChips({
  categoriesPromise,
  selected,
  onSelect,
}: {
  categoriesPromise: Promise<CategoryOption[]>;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  useEffect(() => {
    let active = true;
    categoriesPromise.then((next) => {
      if (active) setCategories(next);
    });
    return () => { active = false; };
  }, [categoriesPromise]);
  return <CategoryChips categories={categories} selected={selected} onSelect={onSelect} />;
}

function ResolvedCategorySidebar({
  categoriesPromise,
  selected,
  onSelect,
}: {
  categoriesPromise: Promise<CategoryOption[]>;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  useEffect(() => {
    let active = true;
    categoriesPromise.then((next) => {
      if (active) setCategories(next);
    });
    return () => { active = false; };
  }, [categoriesPromise]);
  return <CategorySidebar categories={categories} selected={selected} onSelect={onSelect} />;
}

function ResolvedProductGrid({
  productsPromise,
  onSelect,
  isGuest,
}: {
  productsPromise: Promise<ProductListing[]>;
  onSelect: (product: ProductListing) => void;
  isGuest: boolean;
}) {
  const [products, setProducts] = useState<ProductListing[]>([]);
  useEffect(() => {
    let active = true;
    productsPromise.then((next) => {
      if (active) setProducts(next);
    });
    return () => { active = false; };
  }, [productsPromise]);
  if (products.length === 0) {
    return <MenuEmptyState hasFilter={false} />;
  }
  return (
    <>
      <div className="hidden gap-[16px] pt-[24px] md:grid md:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={onSelect} isGuest={isGuest} />
        ))}
      </div>
      <div className="flex flex-col md:hidden">
        {products.map((product) => (
          <ProductRow key={product.id} product={product} onSelect={onSelect} />
        ))}
      </div>
    </>
  );
}

function ResolvedCartRail({
  cartPromise,
  arrivalEstimatePromise,
  optimisticCartLines,
  setOptimisticCartLines,
  initialFulfilment,
}: {
  cartPromise: Promise<CartRead>;
  arrivalEstimatePromise: Promise<string | null>;
  optimisticCartLines: CartLine[] | null;
  setOptimisticCartLines: (lines: CartLine[]) => void;
  initialFulfilment?: Fulfilment;
}) {
  const [cart, setCart] = useState<CartRead | null>(null);
  const [arrivalEstimate, setArrivalEstimate] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    cartPromise.then((next) => {
      if (active) setCart(next);
    });
    return () => { active = false; };
  }, [cartPromise]);
  // Resolved separately from the cart: the estimate is a nicety, and the
  // rail must not wait on a queue count to show someone their own items.
  useEffect(() => {
    let active = true;
    arrivalEstimatePromise.then((next) => {
      if (active) setArrivalEstimate(next);
    });
    return () => { active = false; };
  }, [arrivalEstimatePromise]);
  React.useEffect(() => {
    if (!cart) return;
    setOptimisticCartLines(cart.lines);
  }, [cart, setOptimisticCartLines]);

  return (
    <DesktopCartRail
      lines={optimisticCartLines ?? cart?.lines ?? []}
      initialFulfilment={initialFulfilment}
      arrivalEstimate={arrivalEstimate}
    />
  );
}

function ResolvedBottomTabBar({
  cartPromise,
  optimisticCartLines,
}: {
  cartPromise: Promise<CartRead>;
  optimisticCartLines: CartLine[] | null;
}) {
  const [cart, setCart] = useState<CartRead | null>(null);
  useEffect(() => {
    let active = true;
    cartPromise.then((next) => {
      if (active) setCart(next);
    });
    return () => { active = false; };
  }, [cartPromise]);
  return <BottomTabBar current="menu" cartCount={cartItemCount(optimisticCartLines ?? cart?.lines ?? [])} />;
}
