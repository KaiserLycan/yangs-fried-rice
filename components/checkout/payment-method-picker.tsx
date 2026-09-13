"use client";

import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/lib/checkout/payment-methods";

/**
 * The payment method block — a 2×2 grid on desktop (`133:1106`), a
 * full-width stack on mobile (`132:457`). Same options, same order, same
 * selected treatment; only the arrangement differs, which is why this is one
 * component rather than two.
 *
 * A radio group rather than four buttons: exactly one option is chosen at a
 * time, which is what `role="radio"` means to a screen reader and what four
 * unrelated buttons would not say. The frame draws the selection as a filled
 * dot and a flame-coloured border, so the dot is decorative here
 * (`aria-hidden`) — `aria-checked` is what actually carries the state.
 *
 * Selecting a method changes nothing but this state. See
 * `lib/checkout/payment-methods.ts` for why nothing is processed.
 */
export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Payment method"
      className="grid grid-cols-1 gap-[8px] md:grid-cols-2 md:gap-[10px]"
    >
      {PAYMENT_METHODS.map((method) => {
        const isSelected = method.id === value;

        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(method.id)}
            className={cn(
              "flex items-center justify-between rounded-[13px] border p-[14px] text-left text-[14px] font-bold text-foreground",
              isSelected
                ? "border-accent bg-secondary/50"
                : "border-rule bg-card",
            )}
          >
            {method.label}
            {isSelected ? (
              <span aria-hidden="true" className="text-[14px] text-primary">
                ●
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
