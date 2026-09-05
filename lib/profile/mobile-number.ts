/**
 * The customer's mobile number, in the grouping the profile frames draw.
 *
 * This is a presentation rule, but it is **not** display-only: the frame's
 * editing state shows the grouped form inside the input, so the contact card
 * seeds its field with this too, and the grouped string is what a submit
 * would carry. That is safe in both directions — the validator strips
 * separators before matching, and sign-up's own note already hands
 * normalisation to whoever persists the number — but it does mean this
 * function can reshape what reaches the backend, so it stays lossless.
 */

/** The canonical shapes `customerMobileSchema` accepts, minus separators. */
const LOCAL_MOBILE = /^09(\d{2})(\d{3})(\d{4})$/;
const INTERNATIONAL_MOBILE = /^\+?639(\d{2})(\d{3})(\d{4})$/;
const SEPARATORS = /[\s().-]/g;

/**
 * "0917 402 8851", the grouping the frames draw, from whatever shape the
 * number was stored in.
 *
 * Sign-up validates the number but deliberately does not normalise it — its
 * own comment hands that job to whoever persists it — so the same customer's
 * number can reach this screen as `09171234567`, `0917-123-4567` or
 * `+63 917 123 4567`. Grouping here means the card reads the same either way
 * without the frontend rewriting stored data.
 *
 * Anything that does not match a Philippine mobile comes back untouched. A
 * number this function cannot parse is still the customer's number, and
 * showing it as stored is more honest than hiding it or mangling it into a
 * grouping it does not have.
 */
export function formatMobileNumber(stored: string | null | undefined): string {
  if (!stored) return "";

  const compact = stored.replace(SEPARATORS, "");
  const groups =
    compact.match(LOCAL_MOBILE) ?? compact.match(INTERNATIONAL_MOBILE);

  if (!groups) return stored;

  const [, area, prefix, line] = groups;
  return `09${area} ${prefix} ${line}`;
}
