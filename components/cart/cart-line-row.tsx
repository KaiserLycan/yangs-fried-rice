"use client";

import * as React from "react";
import { ItemDetailModal } from "@/components/menu/item-detail-modal";
import { QuantityInput } from "@/components/menu/quantity-stepper";
import { removeCartItem, updateCartItem } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { formatPeso } from "@/lib/menu/product-listing";
import { lineTotal, type CartLine } from "@/lib/menu/cart-totals";
import { quantityRoom } from "@/lib/cart/limits";
import { MAX_QUANTITY, MIN_QUANTITY, clampQuantity } from "@/lib/menu/quantity";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
 *
 * The count can be typed (panel F7), through the same `QuantityInput` the
 * item dialog uses. Typing never removes the line — it clamps to 1–20 — so
 * clearing the field to type a new number can't delete the dish; − and
 * Remove do that.
 *
 * "Edit" reopens the dish's own dialog with this line's quantity, note and
 * add-ons ticked (limitations #23), and saves over the line rather than
 * making the customer remove it and start again.
 */
export function CartLineRow({ 
  line,
  onUpdate,
  onRemove,
  cartTotalItems = line.quantity,
  dishItems = line.quantity,
}: { 
  line: CartLine;
  onUpdate?: (quantity: number) => void;
  onRemove?: () => void;
  /**
   * Items in the whole cart, and of this line's dish across all its lines
   * (issue #115). `+` stops where the order would pass 30 or the dish 20, so
   * the server never has to refuse and no second message appears.
   */
  cartTotalItems?: number;
  dishItems?: number;
}) {
  const { run, pending } = useCartAction();

  const isOptimistic = line.id.startsWith("optimistic-");
  const isPending = pending || isOptimistic;

  const [localQuantity, setLocalQuantity] = React.useState(line.quantity);

  // The most this line may reach: its own quantity plus whatever still fits
  // in the order and of this dish. A cart already over (filled before the
  // limits) can keep what it has and go down, never up.
  const { room } = quantityRoom({ cartTotalItems, dishItems, baseline: line.quantity });
  const lineMax = Math.max(MIN_QUANTITY, room, Math.min(localQuantity, MAX_QUANTITY));
  const [editing, setEditing] = React.useState(false);
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
    if (quantity > localQuantity && quantity > room) return;

    // Stepping below one removes the line, and does it now rather than in
    // 600ms. The write used to be the only thing that checked the lower
    // bound, so until the debounce fired the screen showed whatever the
    // customer had clicked down to — 0, then −1, −2 — with the line total
    // going negative underneath it. Nothing stopped the clicks: `isPending`
    // only becomes true once the write starts, which is after the wait.
    if (quantity < MIN_QUANTITY) {
      remove();
      return;
    }

    // Belt and braces on the upper bound too, through the shared helper the
    // menu's stepper already uses, so the two cannot drift apart.
    const next = clampQuantity(quantity);
    setLocalQuantity(next);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      onUpdate?.(next);
      run(() => updateCartItem(line.id, { quantity: next }));
    }, 600);
  };

  const openEditor = () => {
    // The dialog saves the quantity too, so a pending typed change would
    // only race it.
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setEditing(true);
  };

  if (isOptimistic) {
    return (
      <div className="flex flex-col gap-[7px] rounded-md border border-field-border bg-card p-[11px]">
        <div className="flex justify-between">
          <div className="h-[18px] w-1/2 animate-pulse rounded-sm bg-secondary/40" />
          <div className="h-[18px] w-12 animate-pulse rounded-sm bg-secondary/40" />
        </div>
        <div className="mt-[8px] h-[27px] w-[90px] animate-pulse rounded-sm bg-secondary/40" />
      </div>
    );
  }

  // Calculate local line total based on debounced localQuantity 
  const localLineTotal = lineTotal({ ...line, quantity: localQuantity });

  return (
    <div className="flex flex-col gap-[7px] rounded-md border border-field-border bg-card p-[11px]">
      <div className="flex items-start justify-between gap-[8px]">
        <span className="text-sm font-bold text-foreground">
          {line.name}
        </span>
        <span className="text-sm font-bold text-primary">
          {formatPeso(localLineTotal)}
        </span>
      </div>

      {line.addOns && line.addOns.length > 0 ? (
        <ul className="-mt-1 flex flex-col gap-0.5 pl-0 text-sm text-muted-foreground">
          {line.addOns.map((addon) => (
            <li key={addon.addon_id}>+ {addon.name}</li>
          ))}
        </ul>
      ) : null}

      {line.specialInstructions ? (
        <p className="text-sm italic text-muted-foreground">
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
        <QuantityInput
          value={localQuantity}
          onChange={setQuantity}
          disabled={isPending}
          max={lineMax}
          label={`Quantity of ${line.name}`}
          className="h-[44px] w-[48px] rounded-sm border border-field-border bg-background text-center text-base font-bold text-foreground"
        />
        <StepButton
          glyph="+"
          label="Increase quantity"
          disabled={isPending || localQuantity >= MAX_QUANTITY || localQuantity >= room}
          onClick={() => setQuantity(localQuantity + 1)}
        />

        <div className="ml-auto flex items-center gap-[4px]">
          {line.product ? (
            <Button variant="unstyled"
              type="button"
              onClick={openEditor}
              disabled={isPending}
              className="min-h-[44px] px-[6px] text-sm font-bold text-foreground underline disabled:opacity-60"
            >
              Edit
            </Button>
          ) : null}
          <Button variant="unstyled"
            type="button"
            onClick={remove}
            disabled={isPending}
            className="min-h-[44px] px-[6px] text-sm font-bold text-primary underline disabled:opacity-60"
          >
            Remove
          </Button>
        </div>
      </div>

      {line.product ? (
        <ItemDetailModal
          product={editing ? line.product : null}
          onClose={() => setEditing(false)}
          // Totals as the dialog will see them: this line at its on-screen
          // quantity, which can be ahead of the saved one mid-debounce.
          cartTotalItems={cartTotalItems - line.quantity + localQuantity}
          cartProductItems={dishItems - line.quantity + localQuantity}
          editing={{
            cartItemId: line.id,
            quantity: localQuantity,
            specialInstructions: line.specialInstructions,
            addOnIds: (line.addOns ?? []).map((addOn) => addOn.addon_id),
          }}
        />
      ) : null}
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
    <Button variant="unstyled"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[44px] items-center justify-center rounded-sm border border-field-border bg-background text-base font-bold text-foreground disabled:opacity-60"
    >
      {glyph}
    </Button>
  );
}
