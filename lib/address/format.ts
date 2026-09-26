/**
 * The one-line form of an address, e.g. "Unit 4B 21 Mabini St., Malate,
 * Manila 1004".
 *
 * The parts are stored in their own columns (`building_no`, `street`,
 * `barangay`, `city`, `zip_code`); `customer_address.address_details` is a
 * generated column built by the database with this exact expression, so
 * anything formatted here matches what a query returns.
 */
export type AddressPartsInput = {
  buildingNo?: string | null;
  street?: string | null;
  barangay?: string | null;
  city?: string | null;
  zip?: string | null;
};

export function formatAddress({
  buildingNo,
  street,
  barangay,
  city,
  zip,
}: AddressPartsInput): string {
  const line1 = [buildingNo, street].map((p) => p?.trim()).filter(Boolean).join(" ");
  const line3 = [city, zip].map((p) => p?.trim()).filter(Boolean).join(" ");
  return [line1, barangay?.trim(), line3].filter(Boolean).join(", ");
}

/** The address columns every read of `customer_address` selects. */
export const ADDRESS_COLUMNS =
  "address_id, label, building_no, street, barangay, city, zip_code, address_details, address_note, is_default";

type AddressRow = {
  building_no: string | null;
  street: string | null;
  barangay: string | null;
  city: string | null;
  zip_code: string | null;
};

/** Column names → the camelCase parts the forms use. */
export function addressPartsFromRow(row: AddressRow) {
  return {
    buildingNo: row.building_no ?? "",
    street: row.street ?? "",
    barangay: row.barangay ?? "",
    city: row.city ?? "",
    zip: row.zip_code ?? "",
  };
}

/** The camelCase parts → column names, for inserts and updates. */
export function addressRowFromParts(parts: {
  buildingNo: string;
  street: string;
  barangay: string;
  city: string;
  zip: string;
}) {
  return {
    building_no: parts.buildingNo.trim(),
    street: parts.street.trim(),
    barangay: parts.barangay.trim(),
    city: parts.city.trim(),
    zip_code: parts.zip.trim(),
  };
}
