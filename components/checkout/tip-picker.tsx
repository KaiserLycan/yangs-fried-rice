"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MAX_TIP, TIP_PRESETS } from "@/lib/checkout/order-rules";
import { cn } from "@/lib/utils";

/**
 * "Add a tip for the staff" (panel feedback F19). Peso amounts, never
 * percentages, with ₱0 first so leaving no tip is a choice on screen rather
 * than something to hunt for. "Other" opens a field for any whole amount up
 * to MAX_TIP.
 */
export function TipPicker({ value, onChange }: { value: number; onChange: (tip: number) => void }) {
  const isPreset = (TIP_PRESETS as readonly number[]).includes(value);
  const [custom, setCustom] = React.useState(!isPreset);
  const [draft, setDraft] = React.useState(isPreset ? "" : String(value));

  return (
    <div className="flex flex-col gap-[10px]">
      <div role="radiogroup" aria-label="Tip for the staff" className="grid grid-cols-5 gap-[8px]">
        {TIP_PRESETS.map((amount) => {
          const selected = !custom && value === amount;
          return (
            <Button
              key={amount}
              variant="unstyled"
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setCustom(false);
                onChange(amount);
              }}
              className={cn(
                "min-h-[44px] rounded-md border text-sm font-bold text-foreground",
                selected ? "border-accent bg-secondary/50" : "border-rule bg-card",
              )}
            >
              {amount === 0 ? "None" : `₱${amount}`}
            </Button>
          );
        })}
        <Button
          variant="unstyled"
          type="button"
          role="radio"
          aria-checked={custom}
          onClick={() => {
            setCustom(true);
            onChange(Number(draft) || 0);
          }}
          className={cn(
            "min-h-[44px] rounded-md border text-sm font-bold text-foreground",
            custom ? "border-accent bg-secondary/50" : "border-rule bg-card",
          )}
        >
          Other
        </Button>
      </div>

      {custom && (
        <label className="flex items-center gap-[8px] text-sm text-muted-strong">
          <span className="font-bold text-foreground">₱</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_TIP}
            step={1}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              const amount = Math.floor(Number(event.target.value));
              onChange(Number.isFinite(amount) ? Math.min(MAX_TIP, Math.max(0, amount)) : 0);
            }}
            aria-label="Tip amount in pesos"
            className="h-[44px] w-[140px] rounded-md border border-field-border bg-card px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <span>up to ₱{MAX_TIP.toLocaleString("en-PH")}</span>
        </label>
      )}

      <p className="text-sm text-muted-foreground">
        Every peso goes to the staff on shift. It&apos;s added to what you pay and isn&apos;t required.
      </p>
    </div>
  );
}
