import * as React from "react";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function OrdersLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mock Nav Bar */}
      <nav className="hidden h-[58px] items-center gap-[26px] bg-primary px-[22px] md:flex">
        <div className="font-display text-lg tracking-[0.57px]">
          <span className="text-on-brand-accent">YANG&apos;S</span>{" "}
          <span className="text-background">FRIED RICE</span>
        </div>
        <ul className="flex items-start gap-[20px]">
          {["Menu", "My orders", "Account"].map((label, i) => (
            <li key={i} className="text-sm text-background/[0.72]">
              {label}
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-[16px]">
          <div className="flex flex-col items-end gap-[4px]">
            <div className="h-[12px] w-[50px] animate-pulse rounded-sm bg-white/20" />
            <div className="h-[12px] w-[80px] animate-pulse rounded-sm bg-white/20" />
          </div>
          <div className="size-[32px] animate-pulse rounded-full bg-white/20" />
        </div>
      </nav>

      {/* Mobile header */}
      <div className="flex items-center gap-[12px] border-b border-rule px-[20px] py-[18px] md:hidden">
        <h1 className="font-display text-2xl uppercase text-foreground">
          MY ORDERS
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[12px] px-[20px] pb-[calc(var(--tab-bar-height)+24px)] pt-[16px] md:gap-[20px] md:px-[40px] md:pb-[60px] md:pt-[30px]">
        {/* Desktop heading */}
        <h1 className="hidden font-display text-3xl text-foreground md:block">
          MY ORDERS
        </h1>

        {/* Search Bar Skeleton */}
        <div className="flex w-full max-w-[520px] gap-2">
          <div className="h-[44px] flex-1 animate-pulse rounded-md border border-field-border bg-card" />
          <div className="h-[44px] w-[88px] animate-pulse rounded-md bg-secondary/30" />
        </div>

        {/* Orders Card Grid */}
        <ul className="flex list-none flex-col gap-[12px] md:grid md:grid-cols-3 md:gap-[16px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="flex h-full flex-col gap-[10px] rounded-lg border border-rule bg-card p-[14px] md:gap-[12px] md:p-[16px]">
                <div className="flex items-baseline justify-between gap-[8px]">
                  <div className="h-4 w-28 animate-pulse rounded-sm bg-secondary/30" />
                  <div className="h-4 w-16 animate-pulse rounded-sm bg-secondary/30" />
                </div>
                <div className="flex flex-col gap-1.5 py-1">
                  <div className="h-4 w-3/4 animate-pulse rounded-sm bg-secondary/40" />
                  <div className="h-3 w-1/2 animate-pulse rounded-sm bg-secondary/20" />
                </div>
                <div className="mt-auto flex items-center justify-between gap-[12px] pt-[8px]">
                  <div className="h-6 w-20 animate-pulse rounded-sm bg-secondary/40" />
                  <div className="h-8 w-24 animate-pulse rounded-md bg-secondary/30" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <BottomTabBar current="orders" cartCount={0} />
    </div>
  );
}
