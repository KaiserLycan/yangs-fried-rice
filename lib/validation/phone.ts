import { z } from "zod";

/**
 * The one definition of a phone number in this app: `+63` followed by ten
 * digits, the Philippine mobile format. Customers, managers, staff and riders
 * all enter their number through `components/ui/phone-input.tsx`, which shows
 * the `+63` as fixed text and only accepts those ten digits, and every screen
 * and server action validates against the schemas below.
 *
 * Everything lives here rather than being restated per screen, because two
 * copies of "what a phone number looks like" is exactly how one form starts
 * accepting a number another form rejects. `lib/validation/signup.ts` and
 * `lib/profile/mobile-number.ts` re-export from this module for the callers
 * that already imported from them.
 *
 * A Philippine mobile subscriber number always begins with 9 (0917…, 0999…),
 * so that is part of the rule: `+63` + `9` + nine more digits.
 */

export const PH_MOBILE_PREFIX = "+63";

/** Digits typed after the `+63`. */
export const PH_MOBILE_DIGITS = 10;

/** How the number is shown as an example, in hints and placeholders. */
export const PH_MOBILE_EXAMPLE = "+63 917 123 4567";

/** Spaces, dots, dashes and brackets are how people write a number, not part of it. */
export const PHONE_SEPARATORS = /[\s().-]/g;

/**
 * Accepts the shapes a person actually types or that are already stored —
 * `9171234567`, `09171234567`, `639171234567`, `+639171234567` — so an older
 * row written before this rule existed is still read as valid.
 */
export const PH_MOBILE_GROUPS_PATTERN = /^(?:\+?63|0)?9\d{9}$/;

export const INVALID_MOBILE_MESSAGE = "Enter a valid mobile number.";

/**
 * The ten subscriber digits, from whatever was typed or pasted.
 *
 * A country code or a trunk `0` is only dropped when what remains would still
 * be a full ten-digit number. That matters while someone is typing: a person
 * who starts with `0` sees the `0` rather than watching their first keystroke
 * disappear, and the digit is rejected by the rule above instead.
 */
export function phoneDigitsOf(raw: string | null | undefined): string {
  let digits = (raw ?? "").replace(/\D/g, "");

  if (digits.length > PH_MOBILE_DIGITS && digits.startsWith("63")) {
    digits = digits.slice(2);
  }
  if (digits.length > PH_MOBILE_DIGITS && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, PH_MOBILE_DIGITS);
}

/**
 * The input mask: up to ten subscriber digits grouped the way they are
 * displayed everywhere else — `962 693 9019` — so what someone types beside
 * the fixed `+63` looks exactly like the number on their profile afterwards.
 * Groups appear as the digits arrive ("962", "962 6", "962 693 9").
 */
export function maskPhoneDigits(raw: string | null | undefined): string {
  const digits = phoneDigitsOf(raw);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)]
    .filter(Boolean)
    .join(" ");
}

/** Length of the masked value: ten digits and two spaces. */
export const PH_MOBILE_MASKED_LENGTH = PH_MOBILE_DIGITS + 2;

/** Is this a valid Philippine mobile number, however it was written? */
export function isValidPhMobile(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return PH_MOBILE_GROUPS_PATTERN.test(raw.replace(PHONE_SEPARATORS, ""));
}

/**
 * The canonical `+63XXXXXXXXXX` form that gets stored, so the same person's
 * number is one string in the database rather than three.
 * Returns "" for blank input.
 */
export function toInternationalMobile(raw: string | null | undefined): string {
  const digits = phoneDigitsOf(raw);
  return digits ? `${PH_MOBILE_PREFIX}${digits}` : "";
}

/**
 * `+63 917 402 8851` — the grouping the profile frames draw.
 *
 * Anything this cannot parse comes back untouched: a number it does not
 * recognise is still that person's number, and showing it as stored is more
 * honest than hiding it or forcing it into a grouping it does not have.
 */
export function formatMobileNumber(stored: string | null | undefined): string {
  if (!stored) return "";

  // Only a recognised mobile is regrouped. A landline like "(02) 8812 3456"
  // is ten digits too, and counting digits alone would relabel it "+63 028…".
  if (!isValidPhMobile(stored)) return stored;

  const digits = phoneDigitsOf(stored);
  return `${PH_MOBILE_PREFIX} ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/** A required mobile number. */
export const phoneSchema = z
  .string()
  .refine((value) => isValidPhMobile(value), INVALID_MOBILE_MESSAGE);

/** A mobile number that may be left blank. */
export const optionalPhoneSchema = z.union([z.literal(""), phoneSchema]);
