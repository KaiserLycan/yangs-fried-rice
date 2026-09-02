import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Renders the invalid border from the error frames and sets aria-invalid. */
  invalid?: boolean;
}

/**
 * Input's multi-line twin, carrying the same border, padding and error
 * treatment. It exists for the delivery address, which is one free-text
 * string that people write across two or three lines.
 *
 * `resize-none` because the field sits in a column measured from the design;
 * a drag handle would let the customer push the button off a 390px screen.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full resize-none rounded-md border bg-white px-[14px] py-[13px] text-[15px] text-foreground placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:p-[14px]",
          invalid ? "border-error-border" : "border-field-border",
          className,
        )}
        {...props}
      />
    );
  },
);
