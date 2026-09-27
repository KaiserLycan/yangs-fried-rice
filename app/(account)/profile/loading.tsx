import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Profile Header Skeleton */}
      <div className="flex flex-col">
        {/* Mock Nav Bar (Desktop) */}
        <nav className="hidden h-[58px] items-center gap-[26px] bg-primary px-[22px] md:flex">
          <div className="font-display text-lg tracking-[0.57px]">
            <span className="text-on-brand-accent">YANG&apos;S</span>{" "}<span className="text-background">FRIED RICE</span>
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

      </div>

      <div className="flex flex-1">
        {/* Profile Sidebar Skeleton (Desktop only) */}
        <aside className="hidden w-[220px] shrink-0 flex-col gap-[6px] border-r border-rule bg-background px-[16px] pt-[20px] md:flex">
          <p className="px-[8px] pb-[6px] text-sm font-bold uppercase tracking-[1.68px] text-muted-foreground">
            Account
          </p>
          <nav className="flex flex-col gap-[6px]">
            {[
              { id: "profile", label: "Profile" },
              { id: "contact", label: "Contact details" },
              { id: "password", label: "Password" },
            ].map(({ id, label }) => {
              const isCurrent = id === "profile";
              return (
                <div
                  key={id}
                  className={`rounded-sm px-[12px] py-[10px] text-sm ${
                    isCurrent
                      ? "bg-rule font-bold text-primary"
                      : "font-medium text-muted-foreground hover:bg-rule/50"
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </nav>
          <div className="mt-[22px] flex flex-col gap-[4px] border-t border-rule px-[8px] pt-[16px]">
            <div className="h-[14px] w-[120px] animate-pulse rounded-sm bg-secondary/40" />
            <div className="h-[14px] w-[150px] animate-pulse rounded-sm bg-secondary/40" />
            <div className="h-[14px] w-[100px] animate-pulse rounded-sm bg-secondary/40" />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 px-[14px] py-[16px] pb-[calc(var(--tab-bar-height)+40px)] md:px-[32px] md:py-[26px]">
          <div className="flex items-center gap-[12px] border-b border-rule px-[20px] py-[18px] md:hidden -mx-[14px] -mt-[16px] mb-[16px]">
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
            <div className="h-[100px] w-full animate-pulse rounded-lg bg-secondary/20 border border-rule md:hidden" />

            {/* Avatar & Personal Details */}
            <div className="flex flex-col gap-[12px] md:flex-row md:items-start md:gap-[18px]">
              {/* Desktop Avatar Card */}
              <div className="hidden size-[220px] shrink-0 animate-pulse rounded-lg bg-secondary/20 border border-rule md:block" />
              
              {/* Personal Details */}
              <div className="h-[180px] min-w-0 flex-1 animate-pulse rounded-lg bg-secondary/20 border border-rule" />
            </div>

            {/* Contact Details */}
            <div className="h-[160px] w-full animate-pulse rounded-lg bg-secondary/20 border border-rule" />

            {/* Password */}
            <div className="h-[120px] w-full animate-pulse rounded-lg bg-secondary/20 border border-rule" />

            <div className="h-[80px] w-full animate-pulse rounded-lg bg-secondary/20 border border-rule" />
          </div>
        </main>
      </div>
      <BottomTabBar current="account" cartCount={0} />
    </div>
  );
}
