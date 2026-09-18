"use client";

import * as React from "react";
import { Suspense, use } from "react";
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

export function MenuScreen({
  profilePromise,
  productsPromise,
  categoriesPromise,
  cartPromise,
  initialFulfilment,
}: {
  profilePromise: Promise<CustomerProfile | null>;
  productsPromise: Promise<ProductListing[]>;
  categoriesPromise: Promise<CategoryOption[]>;
  cartPromise: Promise<CartRead>;
  initialFulfilment?: Fulfilment;
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

  const [optimisticCartLines, setOptimisticCartLines] = React.useState<CartLine[] | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const showToast = useToast();

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

  // Determine if branch is open (8am - 6pm Manila time).
  // Default to true during SSR to avoid hydration mismatch, then check on mount.
  const [isBranchOpen, setIsBranchOpen] = React.useState(true);
  
  React.useEffect(() => {
    import("@/lib/store-hours").then(({ isRestaurantOpen }) => {
      const checkBranchHours = () => {
        setIsBranchOpen(isRestaurantOpen());
      };
      
      checkBranchHours();
      const interval = setInterval(checkBranchHours, 60000);
      return () => clearInterval(interval);
    });
  }, []);

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
      
      {!isBranchOpen && (
        <Alert className="rounded-none border-x-0 border-t-0 flex items-center justify-center">
          Store is currently closed. Restaurant hours are 8am - 6pm.
        </Alert>
      )}

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
              <h2 className="px-[18px] pt-[24px] text-[13px] font-bold uppercase tracking-[0.5px] text-foreground">
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
          <div className="hidden items-baseline gap-[12px] px-[20px] pt-[16px] md:flex md:px-0 md:pt-0">
            <h1 className="font-display text-[32px] uppercase tracking-[0.32px] text-foreground">
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
                    <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
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
              />
            </Suspense>
          )}
        </main>

        <Suspense fallback={
          <aside className="hidden w-[328px] shrink-0 flex-col gap-[14px] border-l border-field-border bg-secondary/20 px-[22px] py-[24px] md:flex">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[22px] text-foreground">YOUR CART</h2>
              <div className="h-[16px] w-16 animate-pulse rounded bg-secondary/40" />
            </div>
            <div className="flex flex-col gap-[10px]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-[7px] rounded-[13px] border border-field-border bg-card p-[11px]">
                  <div className="flex justify-between">
                    <div className="h-[18px] w-1/2 animate-pulse rounded bg-secondary/40" />
                    <div className="h-[18px] w-12 animate-pulse rounded bg-secondary/40" />
                  </div>
                  <div className="mt-2 h-[27px] w-[90px] animate-pulse rounded-[7px] bg-secondary/40" />
                </div>
              ))}
            </div>
          </aside>
        }>
          <ResolvedCartRail 
            cartPromise={cartPromise} 
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
              <span className="text-[19px] leading-none" aria-hidden="true">{icon}</span>
              <span className="text-[11px] font-medium">{label}</span>
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
              <div className="h-[20px] w-3/4 animate-pulse rounded bg-secondary/40" />
              <div className="h-[14px] w-full animate-pulse rounded bg-secondary/40" />
              <div className="h-[14px] w-2/3 animate-pulse rounded bg-secondary/40" />
              <div className="mt-auto flex items-center justify-between pt-[4px]">
                <div className="h-[24px] w-[60px] animate-pulse rounded bg-secondary/40" />
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
              <div className="h-[20px] w-3/4 animate-pulse rounded bg-secondary/40" />
              <div className="h-[14px] w-full animate-pulse rounded bg-secondary/40" />
              <div className="h-[14px] w-2/3 animate-pulse rounded bg-secondary/40" />
              <div className="mt-[2px] h-[22px] w-[50px] animate-pulse rounded bg-secondary/40" />
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
  const categories = use(categoriesPromise);
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
  const categories = use(categoriesPromise);
  return <CategorySidebar categories={categories} selected={selected} onSelect={onSelect} />;
}

function ResolvedProductGrid({
  productsPromise,
  onSelect,
}: {
  productsPromise: Promise<ProductListing[]>;
  onSelect: (product: ProductListing) => void;
}) {
  const products = use(productsPromise);
  if (products.length === 0) {
    return <MenuEmptyState hasFilter={false} />;
  }
  return (
    <>
      <div className="hidden gap-[16px] pt-[24px] md:grid md:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={onSelect} />
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
  optimisticCartLines,
  setOptimisticCartLines,
  initialFulfilment,
}: {
  cartPromise: Promise<CartRead>;
  optimisticCartLines: CartLine[] | null;
  setOptimisticCartLines: (lines: CartLine[]) => void;
  initialFulfilment?: Fulfilment;
}) {
  const cart = use(cartPromise);
  React.useEffect(() => {
    setOptimisticCartLines(cart.lines);
  }, [cart.lines, setOptimisticCartLines]);

  return <DesktopCartRail lines={optimisticCartLines ?? cart.lines} initialFulfilment={initialFulfilment} />;
}

function ResolvedBottomTabBar({
  cartPromise,
  optimisticCartLines,
}: {
  cartPromise: Promise<CartRead>;
  optimisticCartLines: CartLine[] | null;
}) {
  const cart = use(cartPromise);
  return <BottomTabBar current="menu" cartCount={cartItemCount(optimisticCartLines ?? cart.lines)} />;
}
