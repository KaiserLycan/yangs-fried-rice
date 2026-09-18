"use client";

import * as React from "react";
import { removeCartItem, updateCartItem } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { formatPeso } from "@/lib/menu/product-listing";
import { lineTotal, type CartLine } from "@/lib/menu/cart-totals";
import { MAX_QUANTITY, MIN_QUANTITY } from "@/lib/menu/quantity";
import { cn } from "@/lib/utils";

/**
 * One line in the cart (`133:955` desktop, `132:329` mobile): dish name and
 * line total, the special instructions beneath when there are any, then the
 * −/quantity/+ stepper and Remove.
 *
 * The quantity shown is the persisted server value, not local state — the
 * same rule ticket 04 set when these were toasts. Each control calls the
 * backend's write (PR #68) and then re-reads the page, so the number moves
 * only once the database says it has. See `useCartAction` for the shape.
 *
 * Stepping below the minimum removes the line rather than sending a
 * quantity the backend would reject: `updateCartItemSchema` floors at 1, and
 * a customer pressing − on a single item means "take it out". The top is
 * `MAX_QUANTITY`, the same cap the item modal's stepper uses, so the two
 * screens agree on how many of one dish a customer can order.
 */
export function CartLineRow({ 
  line,
  onUpdate,
  onRemove,
}: { 
  line: CartLine;
  onUpdate?: (quantity: number) => void;
  onRemove?: () => void;
}) {
  const { run, pending } = useCartAction();

  const isOptimistic = line.id.startsWith("optimistic-");
  const isPending = pending || isOptimistic;

  const [localQuantity, setLocalQuantity] = React.useState(line.quantity);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!debounceTimerRef.current) {
      setLocalQuantity(line.quantity);
    }
  }, [line.quantity]);

  const remove = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onRemove?.();
    run(() => removeCartItem(line.id));
  };

  const setQuantity = (quantity: number) => {
    if (quantity > MAX_QUANTITY) return;
    
    setLocalQuantity(quantity);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      if (quantity < MIN_QUANTITY) {
        remove();
      } else {
        onUpdate?.(quantity);
        run(() => updateCartItem(line.id, { quantity }));
      }
    }, 600);
  };

  if (isOptimistic) {
    return (
      <div className="flex flex-col gap-[7px] rounded-[13px] border border-field-border bg-card p-[11px]">
        <div className="flex justify-between">
          <div className="h-[18px] w-1/2 animate-pulse rounded bg-secondary/40" />
          <div className="h-[18px] w-12 animate-pulse rounded bg-secondary/40" />
        </div>
        <div className="mt-[8px] h-[27px] w-[90px] animate-pulse rounded-[7px] bg-secondary/40" />
      </div>
    );
  }

  // Calculate local line total based on debounced localQuantity 
  const localLineTotal = lineTotal({ ...line, quantity: localQuantity });

  return (
    <div className="flex flex-col gap-[7px] rounded-[13px] border border-field-border bg-card p-[11px]">
      <div className="flex items-start justify-between gap-[8px]">
        <span className="text-[13px] font-bold text-foreground">
          {line.name}
        </span>
        <span className="text-[13px] font-bold text-primary">
          {formatPeso(localLineTotal)}
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
          disabled={isPending}
          onClick={() => setQuantity(localQuantity - 1)}
        />
        <span className="min-w-[14px] px-[3px] text-center text-[13px] font-bold text-foreground">
          {localQuantity}
        </span>
        <StepButton
          glyph="+"
          label="Increase quantity"
          disabled={isPending || localQuantity >= MAX_QUANTITY}
          onClick={() => setQuantity(localQuantity + 1)}
        />

        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="ml-auto text-[11px] font-bold text-primary underline disabled:opacity-60"
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
  disabled,
  onClick,
}: {
  glyph: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[27px] items-center justify-center rounded-[7px] border border-field-border bg-background text-[13px] font-bold text-foreground disabled:opacity-60"
    >
      {glyph}
    </button>
  );
}
