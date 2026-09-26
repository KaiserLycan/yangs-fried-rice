"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/tooltip";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";

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
  const inputRef = React.useRef<HTMLInputElement>(null);
  // "/" jumps to the search box from anywhere on the menu. Only the visible
  // field takes it — the nav and mobile copies are both mounted.
  useShortcut(SHORTCUTS.focusSearch.combo, () => {
    const input = inputRef.current;
    if (!input || input.offsetParent === null) return;
    input.focus();
    input.select();
  });

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
        ref={inputRef}
        type="search"
        maxLength={100}
        title="Search the menu (press / to jump here)"
        role="searchbox"
        aria-label="Search menu items"
        placeholder="Search menu items"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
      />
      {variant === "nav" && !value ? (
        <Kbd className="border-field-border bg-transparent text-muted-foreground">/</Kbd>
      ) : null}
    </label>
  );
}
