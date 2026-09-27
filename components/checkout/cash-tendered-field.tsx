"use client";

import { Button } from "@/components/ui/button";
import { changeDue } from "@/lib/checkout/order-rules";
import { formatPesoCentavos } from "@/lib/menu/product-listing";

/**
 * "I'll pay with ₱___" for pay-in-store orders (limitations L8), so the
 * counter can have change ready. Optional; blank means exact amount. The
 * common notes are one tap away.
 */
const NOTES = [500, 1000] as const;

export function CashTenderedField({
  total,
  value,
  onChange,
}: {
  total: number;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const change = changeDue(total, value);
  const tooLow = value !== null && value < total;

  return (
    <div className="flex flex-col gap-[8px] rounded-md border border-rule bg-card p-[12px]">
      <label htmlFor="cash-tendered" className="text-sm font-bold text-foreground">
        Paying with a bigger bill? <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <div className="flex flex-wrap items-center gap-[8px]">
        <span className="text-base font-bold text-foreground">₱</span>
        <input
          id="cash-tendered"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="Exact amount"
          value={value ?? ""}
          onChange={(event) => {
            const amount = Number(event.target.value);
            onChange(event.target.value === "" || !Number.isFinite(amount) || amount <= 0 ? null : amount);
          }}
          aria-invalid={tooLow || undefined}
          aria-describedby="cash-tendered-help"
          className="h-[44px] w-[140px] rounded-md border border-field-border bg-background px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 aria-[invalid]:border-error-border"
        />
        {NOTES.filter((note) => note >= total).map((note) => (
          <Button
            variant="unstyled"
            key={note}
            type="button"
            onClick={() => onChange(note)}
            className="min-h-[44px] rounded-full border border-rule bg-background px-4 text-sm font-bold text-foreground hover:bg-highlight"
          >
            ₱{note.toLocaleString("en-PH")}
          </Button>
        ))}
      </div>
      <p id="cash-tendered-help" className={tooLow ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
        {tooLow
          ? `That's less than the ${formatPesoCentavos(total)} total.`
          : change !== null
            ? `We'll have ${formatPesoCentavos(change)} change ready at the counter.`
            : "Leave blank if you'll pay the exact amount."}
      </p>
    </div>
  );
}
