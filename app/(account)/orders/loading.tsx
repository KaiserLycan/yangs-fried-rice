import * as React from "react";

export default function OrdersLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mock Nav Bar */}
      <nav className="hidden h-[58px] items-center gap-[26px] bg-primary px-[22px] md:flex">
        <div className="font-display text-[19px] tracking-[0.57px] text-rule">
          YANG&apos;S <span className="text-white">FRIED RICE</span>
        </div>
        <ul className="flex items-start gap-[20px]">
          {["Menu", "My orders", "Account"].map((label, i) => (
            <li key={i} className="text-[13.5px] text-background/[0.72]">
              {label}
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-[16px]">
          <div className="flex flex-col items-end gap-[4px]">
            <div className="h-[12px] w-[50px] animate-pulse rounded bg-white/20" />
            <div className="h-[12px] w-[80px] animate-pulse rounded bg-white/20" />
          </div>
          <div className="size-[32px] animate-pulse rounded-full bg-white/20" />
        </div>
      </nav>

      {/* Mobile header */}
      <div className="border-b border-rule px-[20px] py-[18px] md:hidden">
        <h1 className="font-display text-[24px] text-foreground">MY ORDERS</h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[12px] px-[20px] pb-[24px] pt-[16px] md:gap-[20px] md:px-[40px] md:pb-[60px] md:pt-[30px]">
        {/* Desktop heading */}
        <h1 className="hidden font-display text-[32px] text-foreground md:block">
          MY ORDERS
        </h1>

        <ul className="flex list-none flex-col gap-[12px] md:grid md:grid-cols-3 md:gap-[16px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-[180px] w-full animate-pulse rounded-lg bg-secondary/20 border border-rule md:h-[200px]" />
          ))}
        </ul>
      </div>
    </div>
  );
}
