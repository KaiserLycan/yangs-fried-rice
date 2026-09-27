/**
 * A `tel:` link for a phone number that came from the database. The scheme
 * is fixed, and everything but digits and a leading "+" is dropped, so a
 * stored value can neither change what the link does nor break the dialler.
 */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}
