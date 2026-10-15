import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mock Nav Bar (Desktop) */}
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

      <div className="flex flex-1">
        {/* Main Content Area — No desktop sidebar rail per ticket P32 */}
        <main className="flex-1 px-[14px] py-[16px] pb-[calc(var(--tab-bar-height)+40px)] md:px-[32px] md:py-[26px]">
          <div className="-mx-[14px] -mt-[16px] mb-[16px] flex items-center gap-[12px] border-b border-rule px-[20px] py-[18px] md:hidden">
            <div className="flex items-center justify-center">
              <ChevronLeft className="size-[24px] text-foreground" />
            </div>
            <h1 className="font-display text-2xl uppercase text-foreground">
              ACCOUNT
            </h1>
          </div>
          <div className="flex flex-col gap-[12px] md:mx-auto md:max-w-[880px] md:gap-[18px]">
            {/* Desktop Heading */}
            <div className="hidden items-baseline gap-[12px] md:flex">
              <h1 className="font-display text-3xl tracking-[0.32px] text-foreground">
                MY PROFILE
              </h1>
              <p className="text-sm text-muted-foreground">
                name, contact and password
              </p>
            </div>

            {/* Profile Summary Card Mobile */}
            <div className="h-[78px] w-full animate-pulse rounded-sm border border-rule bg-card md:hidden" />

            {/* Avatar & Personal Details */}
            <div className="flex flex-col gap-[12px] md:flex-row md:items-start md:gap-[18px]">
              {/* Desktop Avatar Card */}
              <div className="hidden size-[220px] shrink-0 animate-pulse rounded-lg border border-rule bg-card md:block" />

              {/* Personal Details */}
              <div className="h-[180px] min-w-0 flex-1 animate-pulse rounded-lg border border-rule bg-card" />
            </div>

            {/* Contact Details */}
            <div className="h-[160px] w-full animate-pulse rounded-lg border border-rule bg-card" />

            {/* Password */}
            <div className="h-[120px] w-full animate-pulse rounded-lg border border-rule bg-card" />

            {/* Account Actions */}
            <div className="h-[80px] w-full animate-pulse rounded-lg border border-rule bg-card" />
          </div>
        </main>
      </div>
      <BottomTabBar current="account" cartCount={0} />
    </div>
  );
}
