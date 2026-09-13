"use client";

import { useToast } from "@/components/ui/toast";
import { formatPeso } from "@/lib/menu/product-listing";
import { lineTotal, type CartLine } from "@/lib/menu/cart-totals";

const CART_WRITE_TOAST =
  "Changing your cart isn’t available yet. We’re still building it.";

/**
 * One line in the cart (`133:955` desktop, `132:329` mobile): dish name and
 * line total, the special instructions beneath when there are any, then the
 * −/quantity/+ stepper and Remove.
 *
 * All three controls raise the same toast rather than changing what's on
 * screen. Unlike the item detail modal's stepper, these can't update local
 * state honestly — the quantity shown here is the persisted server value,
 * and there is no write yet to persist a change to. Faking the number
 * moving would be exactly the "looks like it worked but vanishes on
 * refresh" problem ticket 03 already rejected for Add to cart.
 */
export function CartLineRow({ line }: { line: CartLine }) {
  const showToast = useToast();

  return (
    <div className="flex flex-col gap-[7px] rounded-[13px] border border-field-border bg-card p-[11px]">
      <div className="flex items-start justify-between gap-[8px]">
        <span className="text-[13px] font-bold text-foreground">
          {line.name}
        </span>
        <span className="text-[13px] font-bold text-primary">
          {formatPeso(lineTotal(line))}
        </span>
      </div>

      {line.specialInstructions ? (
        <p className="text-[11px] italic text-muted-foreground">
          Note: {line.specialInstructions}
        </p>
      ) : null}

      <div className="flex items-center gap-[8px]">
        <StepButton
          glyph="−"
          label="Decrease quantity"
          onClick={() => showToast(CART_WRITE_TOAST)}
        />
        <span className="min-w-[14px] px-[3px] text-center text-[13px] font-bold text-foreground">
          {line.quantity}
        </span>
        <StepButton
          glyph="+"
          label="Increase quantity"
          onClick={() => showToast(CART_WRITE_TOAST)}
        />

        <button
          type="button"
          onClick={() => showToast(CART_WRITE_TOAST)}
          className="ml-auto text-[11px] font-bold text-primary underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function StepButton({
  glyph,
  label,
  onClick,
}: {
  glyph: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-[27px] items-center justify-center rounded-[7px] border border-field-border bg-background text-[13px] font-bold text-foreground"
    >
      {glyph}
    </button>
  );
}
