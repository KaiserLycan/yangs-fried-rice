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
        <h1 className="font-display text-[24px] uppercase text-foreground">
          YOUR CART
        </h1>
      </div>

      <div className="flex flex-1 flex-col px-[20px] pb-[calc(var(--tab-bar-height)+24px)] pt-[24px]">
        <div className="flex flex-1 flex-col gap-[14px]">
          {/* Fulfilment Toggle Skeleton */}
          <div className="mx-auto h-[40px] w-full max-w-[300px] animate-pulse rounded-full bg-secondary/20" />

          {/* Cart Line Rows Skeleton */}
          <div className="mt-[16px] flex flex-col gap-[10px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex h-[80px] w-full gap-[12px] animate-pulse rounded-lg bg-secondary/20 p-[12px]">
                <div className="size-[56px] rounded bg-secondary/40" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="h-[14px] w-[120px] rounded bg-secondary/40" />
                  <div className="h-[14px] w-[60px] rounded bg-secondary/40" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Cart Totals Summary Skeleton */}
          <div className="mt-[20px] flex flex-col gap-[12px] rounded-lg bg-secondary/10 p-[16px]">
            <div className="flex justify-between">
              <div className="h-[14px] w-[80px] animate-pulse rounded bg-secondary/20" />
              <div className="h-[14px] w-[60px] animate-pulse rounded bg-secondary/20" />
            </div>
            <div className="flex justify-between">
              <div className="h-[14px] w-[80px] animate-pulse rounded bg-secondary/20" />
              <div className="h-[14px] w-[60px] animate-pulse rounded bg-secondary/20" />
            </div>
            <div className="mt-[12px] flex justify-between border-t border-rule pt-[12px]">
              <div className="h-[16px] w-[100px] animate-pulse rounded bg-secondary/30" />
              <div className="h-[16px] w-[80px] animate-pulse rounded bg-secondary/30" />
            </div>
          </div>
          <div className="mt-[10px] h-[48px] w-full animate-pulse rounded-full bg-primary/20" />
        </div>
      </div>
      <BottomTabBar current="cart" cartCount={0} />
    </div>
  );
}
