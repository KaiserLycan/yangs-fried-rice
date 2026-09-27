import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Every button in the app goes through this component (UI/UX review,
 * docs/user-simulation.md #16: 113 raw `<button>`s against 44 `<Button>`s
 * meant focus rings and disabled states looked different screen to screen).
 *
 * `BUTTON_BASE` is what every button shares, whatever it looks like: one
 * keyboard focus ring and one disabled treatment. The styled variants add a
 * full look on top; `unstyled` adds nothing, for the buttons whose look is
 * their own (chips, tabs, steppers, icon buttons, list rows) — they still get
 * the shared focus and disabled behaviour, and a `className` that sets its own
 * ring or disabled style still wins (tailwind-merge).
 *
 * Radii come from the scale in tailwind.config.ts (sm 8 / md 12 / lg 16 /
 * full). The primary button used to be 14px, the one value outside it.
 */
export const BUTTON_BASE =
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60";

const SOLID = "inline-flex w-full items-center justify-center font-bold disabled:pointer-events-none";

const buttonVariants = cva(BUTTON_BASE, {
  variants: {
    variant: {
      primary: cn(SOLID, "rounded-md bg-accent p-4 text-base leading-6 text-white hover:bg-accent/90 md:p-[17px]"),
      outline: cn(
        SOLID,
        "rounded-md border border-field-border bg-white p-[13px] text-sm leading-5 text-foreground hover:bg-secondary/40",
      ),
      // The action that carries out what a dialog is asking about. Named
      // for that role rather than for danger: both confirmation frames
      // draw it identically, and one of them is only a sign-out. It is
      // brand red rather than the primary button's flame orange, and
      // deliberately NOT the --destructive token, which is a different
      // colour again.
      confirm: cn(SOLID, "rounded-md bg-primary px-[14px] py-[15px] text-sm leading-5 text-white hover:bg-primary/90"),
      // The submit inside a profile card. Ink rather than flame: the card
      // is already outlined in flame while it is being edited, and a flame
      // button inside a flame border reads as one blur. It is full width on
      // mobile and hugs its label on desktop, which is how both frames draw
      // it.
      save: cn(
        SOLID,
        "rounded-sm bg-foreground p-[13px] text-sm leading-5 text-white hover:bg-foreground/90 md:w-auto md:self-start md:px-[20px] md:py-[11px]",
      ),
      // Shared focus and disabled behaviour only; the look is the caller's.
      unstyled: "",
    },
  },
  defaultVariants: { variant: "primary" },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, ...props },
  ref,
) {
  return <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />;
});
