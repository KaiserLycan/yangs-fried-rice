import * as React from "react";

export default function TrackOrderLoading() {
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

      {/* Main Track Order Layout Skeleton */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:grid-rows-[auto_auto] md:items-start md:gap-[26px] md:px-[26px] md:pb-[60px] md:pt-[30px]">
        {/* Header: full-bleed on mobile, plain on desktop */}
        <header className="flex flex-col gap-[4px] bg-primary p-[20px] md:col-start-1 md:row-start-1 md:gap-[3px] md:bg-transparent md:p-0">
          <div className="mb-1 h-[14px] w-[110px] animate-pulse rounded-sm bg-white/20 md:mb-2 md:bg-secondary/30" />
          <div className="h-[14px] w-[90px] animate-pulse rounded-sm bg-white/20 md:bg-secondary/30" />
          <div className="my-1 h-[32px] w-[260px] animate-pulse rounded-sm bg-white/30 md:h-[48px] md:bg-secondary/40" />
          <div className="h-[14px] w-[180px] animate-pulse rounded-sm bg-white/20 md:bg-secondary/30" />
        </header>

        {/* Pickup Point Panel: 2nd on mobile, top-right on desktop */}
        <div className="flex flex-col gap-2 rounded-lg border border-rule bg-card p-4 md:col-start-2 md:row-start-1">
          <div className="h-4 w-40 animate-pulse rounded-sm bg-secondary/30" />
          <div className="h-5 w-60 animate-pulse rounded-sm bg-secondary/40" />
          <div className="h-4 w-48 animate-pulse rounded-sm bg-secondary/30" />
        </div>

        {/* Timeline Card: 3rd on mobile, bottom-left on desktop */}
        <div className="flex flex-col items-start p-[20px] md:col-start-1 md:row-start-2 md:rounded-lg md:border md:border-rule md:bg-white md:p-[20px]">
          <div className="flex w-full flex-col gap-[20px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-[14px]">
                <div className="size-[24px] shrink-0 animate-pulse rounded-full bg-secondary/30" />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="h-[16px] w-[140px] animate-pulse rounded-sm bg-secondary/30" />
                  <div className="h-[12px] w-[80px] animate-pulse rounded-sm bg-secondary/20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Card: 4th on mobile, bottom-right on desktop */}
        <div className="border-t border-rule p-[20px] md:col-start-2 md:row-start-2 md:rounded-lg md:border md:bg-white">
          <div className="flex flex-col gap-4">
            <div className="h-5 w-24 animate-pulse rounded-sm bg-secondary/30" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-32 animate-pulse rounded-sm bg-secondary/30" />
                  <div className="h-4 w-16 animate-pulse rounded-sm bg-secondary/30" />
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-rule pt-3">
              <div className="h-5 w-16 animate-pulse rounded-sm bg-secondary/40" />
              <div className="h-5 w-20 animate-pulse rounded-sm bg-secondary/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
