"use client";

import { cn } from "@/lib/utils";
import {
  WALLET_PROVIDERS,
  paymentMethodsFor,
  type PaymentMethodId,
  type WalletProvider,
} from "@/lib/checkout/payment-methods";
import type { Fulfilment } from "@/lib/menu/cart-totals";

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
 * Choosing "GCash / Maya wallet" opens one more row, GCash or Maya, because
 * PayMongo sends the customer to one wallet's page or the other and has to be
 * told which before "Place order" fires. No frame draws that row; it borrows
 * the option treatment above it and stays hidden for every other method.
 */
export function PaymentMethodPicker({
  value,
  onChange,
  wallet,
  onWalletChange,
  fulfilment,
}: {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
  wallet: WalletProvider;
  onWalletChange: (value: WalletProvider) => void;
  /** Decides which methods are on offer — see `paymentMethodsFor`. */
  fulfilment: Fulfilment;
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

      {value === "wallet" ? (
        <div
          role="radiogroup"
          aria-label="Wallet"
          className="grid grid-cols-2 gap-[8px] md:gap-[10px]"
        >
          {WALLET_PROVIDERS.map((provider) => {
            const isSelected = provider.id === wallet;
            return (
              <button
                key={provider.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onWalletChange(provider.id)}
                className={cn(
                  "rounded-[13px] border p-[12px] text-center text-[13px] font-bold text-foreground",
                  isSelected
                    ? "border-accent bg-secondary/50"
                    : "border-rule bg-card",
                )}
              >
                {provider.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
