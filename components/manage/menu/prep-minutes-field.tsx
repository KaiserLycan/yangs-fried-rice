"use client";

/**
 * How long the kitchen needs for one of this dish (panel feedback F18).
 * Checkout builds the pickup promise from the slowest dish in the cart, so
 * a 25-minute soup no longer gets the same promise as a bottle of water.
 */
const OPTIONS = [2, 5, 8, 10, 12, 15, 20, 25, 30, 40, 45, 60] as const;

export function PrepMinutesField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}) {
  const options = (OPTIONS as readonly number[]).includes(value) ? OPTIONS : [...OPTIONS, value].sort((a, b) => a - b);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
        Prep time
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-md border border-field-border bg-white px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-70"
      >
        {options.map((minutes) => (
          <option key={minutes} value={minutes}>
            {minutes} minutes
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">Used for the pickup time customers are promised.</p>
    </div>
  );
}
