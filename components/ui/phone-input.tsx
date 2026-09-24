"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  PH_MOBILE_MASKED_LENGTH,
  maskPhoneDigits,
  phoneDigitsOf,
} from "@/lib/validation/phone";

/**
 * The mobile-number field, used by every screen that takes one: customer
 * sign-up and profile, the employee/rider profile, and the manager's employee
 * form.
 *
 * `+63` is fixed text beside the box, and the box is masked: it takes only
 * digits and groups them as they are typed, so typing 9626939019 shows
 * `+63 962 693 9019` — the same shape the number is displayed in on every
 * profile and order screen (`formatMobileNumber`). Anything that is not a
 * digit is dropped as it is typed or pasted, and a pasted `+63…` or `09…` is
 * reduced to the ten subscriber digits.
 *
 * Works controlled (pass `value` + `onValueChange`) or uncontrolled (pass
 * `defaultValue` and read it from the form), because the screens using it do
 * both. `onValueChange` receives the bare digits; a form reading the element
 * directly gets the masked text, which `toInternationalMobile` turns into the
 * stored `+63…` form either way.
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
    const input = event.target;
    const typed = input.value;
    const caret = input.selectionStart ?? typed.length;
    // How many digits sit before the caret — the caret goes back after the
    // same digit once the spaces have been re-inserted, so editing in the
    // middle of the number doesn't throw the cursor to the end.
    const digitsBeforeCaret = typed.slice(0, caret).replace(/\D/g, "").length;

    const masked = maskPhoneDigits(typed);
    // Rewriting the element's own value is what keeps an uncontrolled field
    // (sign-up, the profile cards) showing the mask.
    input.value = masked;

    let position = 0;
    let seen = 0;
    while (position < masked.length && seen < digitsBeforeCaret) {
      if (/\d/.test(masked[position])) seen += 1;
      position += 1;
    }
    try {
      input.setSelectionRange(position, position);
    } catch {
      // Some input types/environments refuse selection; the mask still applies.
    }

    onValueChange?.(phoneDigitsOf(masked));
  }

  // `maxLength` would truncate a pasted "+63 917 123 4567" to its first
  // twelve characters *before* the mask sees it, leaving "63917123". So a
  // paste is spliced in by hand and sent through the normal change path
  // (a native input event, which React and the form's live validation hear).
  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;
    event.preventDefault();

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const next = maskPhoneDigits(
      input.value.slice(0, start) + pasted + input.value.slice(end),
    );

    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setValue?.call(input, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
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
        autoComplete="tel-national"
        maxLength={PH_MOBILE_MASKED_LENGTH}
        placeholder={props.placeholder ?? "917 123 4567"}
        aria-invalid={invalid || undefined}
        {...(value !== undefined
          ? { value: maskPhoneDigits(value) }
          : { defaultValue: maskPhoneDigits(defaultValue) })}
        onChange={handleChange}
        onPaste={handlePaste}
        className={cn("w-full bg-transparent focus:outline-none", inputClassName)}
      />
    </div>
  );
}
