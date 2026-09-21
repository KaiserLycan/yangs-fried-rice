/**
 * The text to validate for a structured address: street, barangay, city and
 * ZIP — never the building number. Empty parts are skipped.
 */
export function addressForGeocoding({
  street,
  barangay,
  city,
  zip,
}: {
  street?: string | null;
  barangay?: string | null;
  city?: string | null;
  zip?: string | null;
}): string {
  const cityAndZip = [city, zip].map((part) => part?.trim()).filter(Boolean).join(" ");
  return [street, barangay, cityAndZip]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
