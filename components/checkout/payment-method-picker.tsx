"use client";

import { cn } from "@/lib/utils";
import {
  WALLET_PROVIDERS,
  paymentMethodsFor,
  type PaymentMethodId,
  type WalletProvider,
} from "@/lib/checkout/payment-methods";
import type { Fulfilment } from "@/lib/menu/cart-totals";
import { Button } from "@/components/ui/button";

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
 * Choosing "GCash / Maya wallet" opens a dropdown, GCash or Maya, because
 * PayMongo sends the customer to one wallet's page or the other and has to be
 * told which before "Place order" fires. No frame draws it; it is a native
 * `<select>` styled like the contact form's, hidden for every other method.
 */
export function PaymentMethodPicker({
  value,
  onChange,
  wallet,
  onWalletChange,
  fulfilment,
  disabledReasons = {},
}: {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
  wallet: WalletProvider;
  onWalletChange: (value: WalletProvider) => void;
  /** Decides which methods are on offer — see `paymentMethodsFor`. */
  fulfilment: Fulfilment;
  /**
   * Methods this customer can't use for this order, with the reason shown
   * under the choices (cash caps and no-show strikes, FINALE L6 / F14).
   */
  disabledReasons?: Partial<Record<PaymentMethodId, string>>;
}) {
  const methods = paymentMethodsFor(fulfilment);

  return (
    <div className="flex flex-col gap-[8px] md:gap-[10px]">
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="grid grid-cols-1 gap-[8px] md:grid-cols-2 md:gap-[10px]"
      >
        {methods.map((method) => {
          const isSelected = method.id === value;
          const blocked = disabledReasons[method.id];

          return (
            <Button variant="unstyled"
              key={method.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={blocked ? true : undefined}
              disabled={Boolean(blocked)}
              onClick={() => onChange(method.id)}
              className={cn(
                "flex items-center justify-between rounded-md border p-[14px] text-left text-sm font-bold text-foreground",
                isSelected
                  ? "border-accent bg-secondary/50"
                  : "border-rule bg-card",
              )}
            >
              {method.label}
              {isSelected ? (
                <span aria-hidden="true" className="text-sm text-primary">
                  ●
                </span>
              ) : null}
            </Button>
          );
        })}
      </div>

      {Object.values(disabledReasons).filter(Boolean).map((reason) => (
        <p key={reason} role="note" className="rounded-md bg-warning-surface px-[12px] py-[10px] text-sm text-warning-text">
          {reason}
        </p>
      ))}

      {value === "wallet" ? (
        <select
          aria-label="Wallet"
          value={wallet}
          onChange={(e) => onWalletChange(e.target.value as WalletProvider)}
          className="w-full rounded-md border border-field-border bg-white px-[14px] py-[13px] text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:p-[14px]"
        >
          {WALLET_PROVIDERS.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
