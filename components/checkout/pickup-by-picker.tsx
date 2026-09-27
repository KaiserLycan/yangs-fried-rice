"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
export type PickupBy = "self_pickup" | "3rd_party_courier";

const OPTIONS: { id: PickupBy; label: string; hint: string }[] = [
  { id: "self_pickup", label: "I'll pick it up", hint: "You collect it at the counter." },
  {
    id: "3rd_party_courier",
    label: "A courier will pick it up",
    hint: "You book Lalamove, Grab or similar; we hand it to your rider.",
  },
];

/**
 * Who collects the order. The counter staff see it as a SELF PICKUP or
 * 3RD PARTY COURIER badge, so they know whether to look for the customer or
 * for a rider asking for the order number.
 *
 * Same radio-group treatment as `PaymentMethodPicker` beside it.
 */
export function PickupByPicker({
  value,
  onChange,
}: {
  value: PickupBy;
  onChange: (value: PickupBy) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Who is picking up"
      className="grid grid-cols-1 gap-[8px] md:grid-cols-2 md:gap-[10px]"
    >
      {OPTIONS.map((option) => {
        const isSelected = option.id === value;
        return (
          <Button variant="unstyled"
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-start justify-between gap-[10px] rounded-md border p-[14px] text-left",
              isSelected ? "border-accent bg-secondary/50" : "border-rule bg-card",
            )}
          >
            <span className="flex flex-col gap-[2px]">
              <span className="text-sm font-bold text-foreground">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.hint}</span>
            </span>
            {isSelected ? (
              <span aria-hidden="true" className="text-sm text-primary">
                ●
              </span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
