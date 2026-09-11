import { cn } from "@/lib/utils";
import { clampQuantity, MAX_QUANTITY, MIN_QUANTITY } from "@/lib/menu/quantity";

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
  const buttonSize = size === "mobile" ? "size-[44px]" : "size-[40px]";

  return (
    <div className="flex items-center gap-[16px]">
      <StepButton
        label="Decrease quantity"
        glyph="−"
        size={buttonSize}
        disabled={value <= MIN_QUANTITY}
        onClick={() => onChange(clampQuantity(value - 1))}
      />
      <span className="min-w-[24px] text-center font-display text-[21px] text-foreground">
        {value}
      </span>
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
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-[11px] border border-field-border bg-card text-[18px] font-bold text-foreground disabled:opacity-40",
        size,
      )}
    >
      {glyph}
    </button>
  );
}
