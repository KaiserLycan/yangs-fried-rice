import { NextResponse } from "next/server";
import { addressSchema } from "@/lib/validation/address";
import { validateNcrAddress } from "@/lib/address/validate-ncr";

/**
 * POST /api/address/validate
 * Body: { address: string }
 *
 * A thin wrapper over `validateNcrAddress` — the single address validator the
 * whole app uses (sign-up, address forms, checkout, delivery fee). It used to
 * carry its own lenient Nominatim + text-heuristic copy, which disagreed with
 * the strict check that ran on submit. Send street, barangay, city and ZIP;
 * leave the house/building number out.
 *
 * Response: { valid, message?, latitude?, longitude?, distance_km?,
 *             formatted_address?, source }
 *   source "geocoder" — found on the map
 *   source "estimate" — map unavailable; accepted by city, distance approximate
 */
export async function validateAddress(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await validateNcrAddress(parsed.data.address);

  return NextResponse.json({
    valid: result.valid,
    message: result.message,
    latitude: result.latitude,
    longitude: result.longitude,
    distance_km: result.distanceKm,
    formatted_address: result.formattedAddress,
    source: result.source ?? null,
  });
}
