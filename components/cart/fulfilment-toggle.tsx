import { cn } from "@/lib/utils";
import type { Fulfilment } from "@/lib/menu/cart-totals";

/**
 * Delivery / Pickup, both breakpoints (`133:949` desktop, `132:369` mobile).
 * Delivery is the frame's default selection.
 *
 * Not persisted anywhere — there is no fulfilment column on `cart` or
 * `cart_item`, and checkout (ticket 05) will need this same choice restated
 * there regardless, so this is plain component state today rather than a
 * value written and read back.
 */
export function FulfilmentToggle({
  value,
  onChange,
}: {
  value: Fulfilment;
  onChange: (value: Fulfilment) => void;
}) {
  return (
    <div className="flex w-full gap-[6px] rounded-[11px] bg-secondary/60 p-[4px]">
      <ToggleOption
        label="Delivery"
        isSelected={value === "delivery"}
        onClick={() => onChange("delivery")}
      />
      <ToggleOption
        label="Pickup"
        isSelected={value === "pickup"}
        onClick={() => onChange("pickup")}
      />
    </div>
  );
}

function ToggleOption({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md p-[9px] text-[12px] font-bold md:p-[11px] md:text-[13px]",
        isSelected
          ? "bg-foreground text-background"
          : "text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
