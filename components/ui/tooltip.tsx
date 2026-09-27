"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCombo, isMac } from "@/lib/hooks/use-shortcut";

/**
 * A small hint that appears when the wrapped control is hovered or focused —
 * what the action does and, when it has one, its keyboard shortcut.
 *
 * Pure CSS (group-hover / group-focus-within), so it costs nothing until
 * shown and works the same for mouse and keyboard users. The text is also
 * wired to the control with `aria-describedby`, so a screen reader announces
 * it. Touch devices never hover, which is fine: the hint is a convenience,
 * never the only place something is explained.
 *
 * `className` styles the wrapper — pass `flex-1` or `w-full` when the wrapped
 * button stretched to fill its row.
 */
export function Tooltip({
  content,
  shortcut,
  side = "top",
  className,
  children,
}: {
  content: React.ReactNode;
  /** A `useShortcut` combo, e.g. "mod+enter". */
  shortcut?: string;
  side?: "top" | "bottom";
  className?: string;
  children: React.ReactElement;
}) {
  const id = React.useId();
  // Rendered as "Ctrl" on the server and swapped to "⌘" after mount on a Mac,
  // so hydration never mismatches.
  const [mac, setMac] = React.useState(false);
  React.useEffect(() => setMac(isMac()), []);

  const child = React.cloneElement(children, {
    "aria-describedby": [children.props["aria-describedby"], id]
      .filter(Boolean)
      .join(" "),
  });

  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {child}
      <span
        id={id}
        role="tooltip"
        className={cn(
          // Out of layout until shown: a hidden tooltip next to the edge of a
          // scroll container otherwise widens it (the menu screen's + Add item).
          "pointer-events-none absolute left-1/2 z-50 hidden w-max max-w-[240px] -translate-x-1/2 rounded-sm bg-foreground px-[9px] py-[6px] text-center text-sm font-medium leading-snug text-white shadow-lg",
          "group-hover/tooltip:block group-hover/tooltip:animate-in group-hover/tooltip:fade-in group-focus-within/tooltip:block group-focus-within/tooltip:animate-in group-focus-within/tooltip:fade-in",
          side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
        )}
      >
        {content}
        {shortcut ? (
          <>
            {" "}
            <Kbd className="ml-[4px]">{formatCombo(shortcut, mac)}</Kbd>
          </>
        ) : null}
      </span>
    </span>
  );
}

/** A key cap, e.g. <Kbd>Ctrl+Enter</Kbd>. */
export function Kbd({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <kbd
      className={cn(
        "inline-block rounded-sm border border-white/30 bg-white/10 px-[5px] py-[1px] font-sans text-sm font-bold leading-none",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
