"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { clampQuantity, MAX_QUANTITY, MIN_QUANTITY } from "@/lib/menu/quantity";
import { Button } from "@/components/ui/button";

/**
 * The −/count/+ control on the item detail view, both breakpoints. The
 * frames draw it at two sizes (40px desktop, 44px mobile) but with
 * identical behaviour, so this takes a `size` rather than being two
 * components.
 *
 * Clamping goes through `clampQuantity` rather than each button clamping
 * only the edge it can reach — a `-` press can't take the value under 1 and
 * a `+` press can't take it over `MAX_QUANTITY` for the same reason, in one
 * place.
 *
 * The count is a field, not a label (panel F7): fifteen of one dish used to
 * take fourteen presses of +. See `QuantityInput`.
 */
export function QuantityStepper({
  value,
  onChange,
  size = "desktop",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "desktop" | "mobile";
}) {
  // 44px at both sizes: the minimum touch target (issue #118). The frames'
  // 40px desktop button was below it.
  const buttonSize = "size-[44px]";

  return (
    <div className="flex items-center gap-[12px]">
      <StepButton
        label="Decrease quantity"
        glyph="−"
        size={buttonSize}
        disabled={value <= MIN_QUANTITY}
        onClick={() => onChange(clampQuantity(value - 1))}
      />
      <QuantityInput
        value={value}
        onChange={onChange}
        className={cn(
          "h-[44px] w-[56px] rounded-md border border-field-border bg-card text-center font-display text-foreground",
          size === "mobile" ? "text-2xl" : "text-lg",
        )}
      />
      <StepButton
        label="Increase quantity"
        glyph="+"
        size={buttonSize}
        disabled={value >= MAX_QUANTITY}
        onClick={() => onChange(clampQuantity(value + 1))}
      />
    </div>
  );
}

/**
 * The typeable count, shared by the item dialog's stepper and each cart
 * line's (panel F7).
 *
 * `inputMode="numeric"` brings up the number pad on a phone without
 * `type="number"`'s spinner arrows and scroll-wheel surprises. Non-digits
 * are dropped as they are typed, and every number is passed through
 * `clampQuantity`, so the field can never hold 0, 25 or "abc": typing 25
 * shows 20 at once, which is itself the explanation.
 *
 * An emptied field is allowed while typing — clearing "1" to type "3" is the
 * normal way to change it — and snaps back to the last good value on blur.
 */
export function QuantityInput({
  value,
  onChange,
  className,
  disabled,
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}) {
  const [draft, setDraft] = React.useState(String(value));

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    if (digits === "") {
      setDraft("");
      return;
    }
    const next = clampQuantity(Number.parseInt(digits, 10));
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      aria-label={label}
      title={`${MIN_QUANTITY} to ${MAX_QUANTITY}`}
      value={draft}
      disabled={disabled}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => {
        if (draft === "") setDraft(String(value));
      }}
      onFocus={(event) => event.currentTarget.select()}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60",
        className,
      )}
    />
  );
}

function StepButton({
  label,
  glyph,
  size,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  size: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="unstyled"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-md border border-field-border bg-card text-lg font-bold text-foreground disabled:opacity-40",
        size,
      )}
    >
      {glyph}
    </Button>
  );
}
