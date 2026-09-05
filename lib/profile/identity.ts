/**
 * Identity details shown around the profile screen: the initials that stand
 * in for a photo, and the join date under the customer's name.
 *
 * Both are derived rather than stored. There is no avatar column yet, and no
 * join date on the customer record — the account's creation date lives on the
 * authenticated user, which is why it is passed in rather than read here.
 */

/**
 * The one or two letters the avatar shows. First letter of the first name,
 * first letter of the last; middle names are skipped so a long name still
 * produces two characters rather than three.
 *
 * `Array.from` rather than indexing, so a character outside the basic plane
 * comes back whole instead of as half a surrogate pair.
 */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  const firstChar = (part: string) => Array.from(part)[0] ?? "";
  const first = firstChar(parts[0]);
  const last = parts.length > 1 ? firstChar(parts[parts.length - 1]) : "";

  return (first + last).toUpperCase();
}

/**
 * Runs an ISO date through a formatter, or gives back an empty string.
 *
 * Both formatters below need the same two guards and the same UTC discipline,
 * so the shape lives here once. Missing and unparseable collapse to the same
 * empty string on purpose: every caller draws an empty state for one, and
 * neither has anything useful to say about the other.
 */
function formatUtcDate(
  isoDate: string | null | undefined,
  formatter: Intl.DateTimeFormat,
): string {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  return formatter.format(date);
}

const MEMBER_SINCE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * "March 2025", from the authenticated user's creation timestamp.
 *
 * Formatted in UTC on purpose. Read in a timezone behind UTC, a date stamped
 * at midnight on the first of the month would roll back into the previous
 * one and report a month the customer never joined in.
 *
 * The locale is pinned rather than left to the runtime so the server and the
 * browser cannot disagree about the month's name and trip a hydration
 * mismatch.
 */
export function formatMemberSince(isoDate: string | null | undefined): string {
  return formatUtcDate(isoDate, MEMBER_SINCE_FORMAT);
}

const DATE_OF_BIRTH_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * "14 June 1996", from the ISO date a native date input produces.
 *
 * Sits beside `formatMemberSince` because it is the same job on the same kind
 * of value, and splitting the two across modules is how they end up
 * disagreeing about timezones.
 *
 * Returns an empty string for a missing value, which today is every customer:
 * there is no date-of-birth column yet, so the card draws its empty state.
 */
export function formatDateOfBirth(isoDate: string | null | undefined): string {
  return formatUtcDate(isoDate, DATE_OF_BIRTH_FORMAT);
}

/**
 * "24 orders" for the summary block, in the sidebar on desktop and the
 * summary card on mobile. Shared so the two cannot drift into pluralising
 * the same number differently.
 */
export function formatOrderCount(count: number): string {
  return count === 1 ? "1 order" : `${count} orders`;
}
