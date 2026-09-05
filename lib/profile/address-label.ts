const MAX_LABEL_LENGTH = 18;

/**
 * The short form of an address, for the "Deliver to" affordance in the nav
 * bar where there is room for a street and nothing else.
 *
 * Addresses are stored as one free-text string — the model has no
 * street/city/postcode breakdown — so the first comma-separated segment is
 * the closest thing to a street line that can be recovered from it. Someone
 * who typed no commas gets their whole address back, trimmed to fit.
 */
export function shortAddressLabel(details: string | null | undefined): string {
  if (!details) return "";

  const firstSegment = details.split(",")[0].trim();
  if (firstSegment.length === 0) return "";
  if (firstSegment.length <= MAX_LABEL_LENGTH) return firstSegment;

  // Back off to the last word boundary that fits, so a trimmed address reads
  // as a shortened street name rather than a word cut in half. A single word
  // longer than the limit has no boundary to find and is cut where it falls.
  const clipped = firstSegment.slice(0, MAX_LABEL_LENGTH - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const kept = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped.trimEnd();

  return `${kept}…`;
}
