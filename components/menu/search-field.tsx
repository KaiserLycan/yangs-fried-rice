"use client";

import { cn } from "@/lib/utils";

/**
 * The search box, in the two places it renders: a 300px field inside
 * `SiteNavBar`'s search slot on desktop (`133:757`), and a full-width field
 * in the mobile browse header (`132:105`). Same control, same behaviour —
 * only the width and the surrounding padding differ, which is why this is
 * one component with a `variant` rather than two.
 *
 * Controlled rather than owning its own state: the menu screen needs the
 * current text to filter with, so the value has to live where the filtering
 * happens.
 */
export function SearchField({
  value,
  onChange,
  variant,
}: {
  value: string;
  onChange: (value: string) => void;
  variant: "nav" | "mobile";
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-[9px] rounded-[12px] bg-background px-[14px] py-[9px]",
        variant === "nav" ? "w-[300px]" : "w-full",
      )}
    >
      <span aria-hidden="true" className="text-[14px] text-muted-foreground">
        ⌕
      </span>
      <input
        type="search"
        role="searchbox"
        aria-label="Search menu items"
        placeholder="Search menu items"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
      />
    </label>
  );
}
