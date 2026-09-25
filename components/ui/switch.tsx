"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * An on/off switch.
 *
 * Extracted from two byte-for-byte copies — the menu modal's "Available?"
 * toggle and a private `ToggleSwitch` in the menu item detail modal — so
 * that the employee modal could use the same control instead of growing a
 * third (issue #106 asked for a toggle there, and a pair of radio buttons
 * had been used instead).
 *
 * Both copies rendered a switch with no accessible name: the visible text
 * sat in a `<label>` with no `htmlFor`, so a screen reader announced only
 * "switch, on". `label` here is bound properly, via `aria-label` when the
 * text is drawn elsewhere or `aria-labelledby` when it is drawn by a real
 * element. One of the two is required.
 *
 * It is a `<button role="switch">` rather than a checkbox because that is
 * what the existing markup was; Space and Enter both toggle it for free.
 */
export function Switch({
  checked,
  onChange,
  label,
  labelledBy,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** Accessible name, when no visible element provides one. */
  label?: string;
  /** Id of the element that names this switch, when one is on screen. */
  labelledBy?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[26px] w-[48px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8541F] focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={{ backgroundColor: checked ? "#3f6b4a" : "#ddcdb8" }}
    >
      <span
        className="pointer-events-none inline-block h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(24px)" : "translateX(4px)" }}
      />
    </button>
  );
}
