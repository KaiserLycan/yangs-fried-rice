import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function CartLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-[12px] border-b border-rule px-[20px] py-[18px] md:hidden">
        <div className="flex items-center justify-center">
          <ChevronLeft className="size-[24px] text-foreground" />
        </div>
        <h1 className="font-display text-2xl uppercase text-foreground">
          YOUR CART
        </h1>
      </div>

      <div className="flex flex-1 flex-col px-[20px] pb-[calc(var(--tab-bar-height)+24px)]">
        <div className="flex min-h-0 flex-1 flex-col gap-[14px]">
          {/* Pickup Notice Banner Skeleton */}
          <div className="h-[40px] w-full animate-pulse rounded-md bg-secondary/30" />

          {/* Cart Line Rows Skeleton */}
          <div className="flex flex-col gap-[10px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-[7px] rounded-md border border-field-border bg-card p-[11px]"
              >
                <div className="flex justify-between">
                  <div className="h-[18px] w-1/2 animate-pulse rounded-sm bg-secondary/40" />
                  <div className="h-[18px] w-12 animate-pulse rounded-sm bg-secondary/40" />
                </div>
                <div className="mt-[8px] h-[27px] w-[90px] animate-pulse rounded-sm bg-secondary/40" />
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Cart Totals Summary Skeleton */}
          <div className="flex flex-col gap-[8px] border-t border-field-border pt-[14px]">
            <div className="mb-1 h-[14px] w-48 animate-pulse rounded-sm bg-secondary/30" />
            <div className="flex justify-between">
              <div className="h-[14px] w-[80px] animate-pulse rounded-sm bg-secondary/30" />
              <div className="h-[14px] w-[60px] animate-pulse rounded-sm bg-secondary/30" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div className="h-[16px] w-[50px] animate-pulse rounded-sm bg-secondary/40" />
              <div className="h-[24px] w-[80px] animate-pulse rounded-sm bg-secondary/40" />
            </div>
            <div className="mt-3 h-[48px] w-full animate-pulse rounded-full bg-primary/30" />
          </div>
        </div>
      </div>
      <BottomTabBar current="cart" cartCount={0} />
    </div>
  );
}
