"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PH_MOBILE_DIGITS, phoneDigitsOf } from "@/lib/validation/phone";

/**
 * The mobile-number field, used by every screen that takes one: customer
 * sign-up and profile, the employee/rider profile, and the manager's employee
 * form.
 *
 * `+63` is fixed text beside the box rather than something to type, and the
 * box itself takes nothing but the ten digits after it — anything else is
 * dropped as it is typed or pasted. So the only number that can be entered is
 * `+63` followed by ten digits, and `lib/validation/phone.ts` checks the same
 * rule again on submit and on the server.
 *
 * Works controlled (pass `value` + `onValueChange`) or uncontrolled (pass
 * `defaultValue` and read it from the form), because the screens using it do
 * both. Either way the value handed over is the bare digits; the caller turns
 * them into the stored `+63…` form with `toInternationalMobile`.
 */
export function PhoneInput({
  invalid,
  value,
  defaultValue,
  onValueChange,
  className,
  inputClassName,
  prefixClassName,
  ...props
}: Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  invalid?: boolean;
  /** Digits only, no `+63`. Providing this makes the field controlled. */
  value?: string;
  /** Digits only, no `+63`. */
  defaultValue?: string;
  onValueChange?: (digits: string) => void;
  /** Wrapper (border, background, radius) — each screen keeps its own look. */
  className?: string;
  inputClassName?: string;
  prefixClassName?: string;
}) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = phoneDigitsOf(event.target.value);
    // Rewriting the element's own value is what keeps an uncontrolled field
    // (sign-up, the profile cards) from showing the stray characters.
    event.target.value = digits;
    onValueChange?.(digits);
  }

  return (
    <div className={cn("flex w-full items-center", className)}>
      <span className={cn("select-none pointer-events-none", prefixClassName)}>
        +63
      </span>
      <input
        {...props}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        maxLength={PH_MOBILE_DIGITS}
        placeholder={props.placeholder ?? "9171234567"}
        aria-invalid={invalid || undefined}
        {...(value !== undefined
          ? { value: phoneDigitsOf(value) }
          : { defaultValue: phoneDigitsOf(defaultValue) })}
        onChange={handleChange}
        className={cn("w-full bg-transparent focus:outline-none", inputClassName)}
      />
    </div>
  );
}
