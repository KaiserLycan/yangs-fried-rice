import * as React from "react";

export default function TrackOrderLoading() {
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

      {/* Main Track Order Layout Skeleton */}
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 md:grid-cols-2 md:items-start md:px-[40px] md:pb-[60px] md:pt-[30px] md:gap-[40px]">
        
        {/* Left Column (Timeline & Header) */}
        <div className="flex flex-col gap-[20px] px-[20px] pt-[20px] md:px-0 md:pt-0">
          <div className="flex flex-col gap-[8px]">
            <div className="h-[32px] w-[200px] animate-pulse rounded bg-secondary/20" />
            <div className="h-[20px] w-[150px] animate-pulse rounded bg-secondary/20" />
          </div>

          <div className="flex flex-col gap-[16px] mt-[20px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-[16px]">
                <div className="size-[24px] rounded-full bg-secondary/20 animate-pulse" />
                <div className="h-[20px] w-full max-w-[200px] animate-pulse rounded bg-secondary/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Map) */}
        <div className="mt-[30px] h-[300px] w-full animate-pulse rounded-lg bg-secondary/20 md:mt-0 md:h-[600px]" />
      </div>
    </div>
  );
}
