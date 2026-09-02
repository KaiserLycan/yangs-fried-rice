import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Radii here are literal rather than scale tokens. The design uses 14px for
 * the primary button, which Collection 1's radius group (8/12/16/999) does
 * not contain. Snapping to 16 was visibly wrong, so the design's own value
 * wins — see the note in globals.css about the collection being incomplete.
 */
const buttonVariants = cva(
  "inline-flex w-full items-center justify-center font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "rounded-[14px] bg-accent p-4 text-[15px] text-white hover:bg-accent/90 md:p-[17px]",
        outline:
          "rounded-md border border-field-border bg-white p-[13px] text-[14px] text-foreground hover:bg-secondary/40",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
