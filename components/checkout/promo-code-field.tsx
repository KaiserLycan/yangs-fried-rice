"use client";

import * as React from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPromoCode } from "@/lib/actions/cart";
import { formatPeso, formatPesoCentavos } from "@/lib/menu/product-listing";
import {
  PROMO_CODE_MAX,
  normalisePromoCode,
  promoCodeSchema,
  type AppliedPromo,
} from "@/lib/validation/promo-code";

/**
 * "Have a promo code?" on checkout. Apply asks the database what the code
 * takes off this cart (`checkPromoCode`); nothing is reserved until the order
 * is placed, when `submit_cart_to_order` prices it again.
 *
 * A promo code and the Senior Citizen / PWD discount are one or the other,
 * so the field is locked while that discount is on.
 */
export function PromoCodeField({
  cartId,
  value,
  onChange,
  blockedReason,
  error,
  onErrorChange,
}: {
  cartId: string;
  value: AppliedPromo | null;
  onChange: (promo: AppliedPromo | null) => void;
  /** Why a code can't be used right now (the Senior / PWD discount is on). */
  blockedReason?: string | null;
  /** Set by checkout when placing the order refused the code. */
  error: string | null;
  onErrorChange: (message: string | null) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const inputId = "promo-code";
  const errorId = "promo-code-error";

  async function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const parsed = promoCodeSchema.safeParse(draft);
    if (!parsed.success) {
      onErrorChange(parsed.error.issues[0]?.message ?? "Enter a promo code.");
      return;
    }
    setChecking(true);
    onErrorChange(null);
    try {
      const result = await checkPromoCode(cartId, parsed.data);
      if (result.error !== null) {
        onErrorChange(result.error);
        return;
      }
      onChange(result.data);
      setDraft("");
    } catch {
      onErrorChange("Couldn’t reach the server. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-[14px] py-[11px]">
        <div className="flex min-w-0 items-center gap-2 text-sm text-success" role="status">
          <Tag className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0">
            <strong className="font-mono">{value.code}</strong> applied —{" "}
            {formatMoney(value.discount)} off
            <span className="block truncate text-muted-foreground">{value.title}</span>
          </span>
        </div>
        <Button
          type="button"
          variant="unstyled"
          onClick={() => {
            onChange(null);
            onErrorChange(null);
          }}
          aria-label={`Remove promo code ${value.code}`}
          className="flex size-[36px] shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-track focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  const disabled = Boolean(blockedReason);

  // Not a <form>: checkout's Ctrl/⌘+Enter shortcut stands down inside forms,
  // and Enter here should apply the code, not place the order.
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={inputId}
        className="text-sm font-bold uppercase tracking-[1.1px] text-muted-foreground"
      >
        Promo code
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          name="promo_code"
          value={draft}
          onChange={(event) => {
            setDraft(normalisePromoCode(event.target.value).slice(0, PROMO_CODE_MAX));
            if (error) onErrorChange(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!checking && draft) void apply();
            }
          }}
          placeholder="e.g. YANGS20"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={PROMO_CODE_MAX}
          disabled={disabled}
          invalid={Boolean(error)}
          aria-describedby={error ? errorId : blockedReason ? `${inputId}-blocked` : undefined}
          className="font-mono uppercase"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void apply()}
          disabled={disabled || checking || draft.length === 0}
          className="shrink-0"
        >
          {checking ? "Checking…" : "Apply"}
        </Button>
      </div>
      {error ? (
        <p id={errorId} aria-live="polite" className="text-sm text-primary">
          {error}
        </p>
      ) : blockedReason ? (
        <p id={`${inputId}-blocked`} className="text-sm text-muted-foreground">
          {blockedReason}
        </p>
      ) : null}
    </div>
  );
}

function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? formatPeso(amount) : formatPesoCentavos(amount);
}
