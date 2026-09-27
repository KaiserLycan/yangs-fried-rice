"use client";

import * as React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Best seller" on menu cards (limitations L14): the top dishes by units in
 * completed orders over the last 30 days (`best_sellers()`). Read once per
 * menu load on the server and shared here, so filtering the menu keeps the
 * badges without asking again.
 */
const BestSellerContext = React.createContext<ReadonlySet<string>>(new Set());

export function BestSellerProvider({
  idsPromise,
  children,
}: {
  idsPromise?: Promise<string[]>;
  children: React.ReactNode;
}) {
  const [ids, setIds] = React.useState<ReadonlySet<string>>(new Set());
  React.useEffect(() => {
    if (!idsPromise) return;
    let active = true;
    idsPromise.then((next) => {
      if (active) setIds(new Set(next));
    });
    return () => {
      active = false;
    };
  }, [idsPromise]);
  return <BestSellerContext.Provider value={ids}>{children}</BestSellerContext.Provider>;
}

export function useIsBestSeller(productId: string): boolean {
  return React.useContext(BestSellerContext).has(productId);
}

export function BestSellerBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-sm font-bold text-white",
        className,
      )}
    >
      <Flame className="size-3.5" aria-hidden />
      Best seller
    </span>
  );
}
