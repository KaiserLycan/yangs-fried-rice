import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The design draws a filled orange square with a "✓" glyph rather than a
 * native control, so the real input is kept but visually hidden and the box
 * is painted off its :checked state. Keeping the input means keyboard focus,
 * form submission and screen readers all still work.
 */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <span className="relative inline-flex size-5 shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none flex size-5 items-center justify-center rounded-[6px] border border-field-border bg-white text-[13px] font-bold leading-none text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40",
          className,
        )}
      >
        ✓
      </span>
    </span>
  );
});
