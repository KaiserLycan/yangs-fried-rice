import { NextResponse } from "next/server";
import { addressSchema } from "@/lib/validation/address";
import { isWithinNcrBoundary, MAX_DELIVERY_RADIUS_KM } from "@/lib/eta/engine";

/** Nominatim API base URL (free, no key required) */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/** User-Agent required by Nominatim usage policy */
const USER_AGENT = "YangsFriedRice/1.0";

/** Timeout for the external geocoding request (ms) */
const NOMINATIM_TIMEOUT_MS = 5000;

/**
 * POST /api/address/validate
 * Body: { address: string }
 *
 * Two-tier validation:
 *  1. Primary  — Nominatim (OpenStreetMap) geocoding lookup
 *  2. Fallback — simple text-based heuristics if Nominatim is unreachable
 */
export async function validateAddress(request: Request) {
  // ── Parse body ──────────────────────────────────────────────
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

  const address = parsed.data.address;

  // ── Try Nominatim geocoding ─────────────────────────────────
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      NOMINATIM_TIMEOUT_MS
    );

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Nominatim returned HTTP ${response.status}`);
    }

    const results = await response.json();

    if (Array.isArray(results) && results.length > 0) {
      const top = results[0];
      const latitude = parseFloat(top.lat);
      const longitude = parseFloat(top.lon);

      // Verify coordinate is within NCR delivery radius (<= 25 km from Malate store)
      const boundaryCheck = isWithinNcrBoundary({ latitude, longitude });
      if (!boundaryCheck.isDeliverable) {
        return NextResponse.json({
          valid: false,
          message: `Delivery is currently restricted to Metro Manila (NCR). This address is ${boundaryCheck.distanceKm} km away (maximum delivery radius: ${MAX_DELIVERY_RADIUS_KM} km).`,
          latitude,
          longitude,
          distance_km: boundaryCheck.distanceKm,
          source: "nominatim",
        });
      }

      return NextResponse.json({
        valid: true,
        formatted_address: top.display_name,
        latitude,
        longitude,
        distance_km: boundaryCheck.distanceKm,
        source: "nominatim",
      });
    }

    // Nominatim responded but found nothing
    return NextResponse.json({
      valid: false,
      message: "Address could not be found. Please check the address and try again.",
      source: "nominatim",
    });
  } catch {
    // Nominatim unreachable → fall through to text-based fallback
  }

  // ── Fallback: text-based validation ─────────────────────────
  const fallbackResult = textBasedValidation(address);

  return NextResponse.json({
    ...fallbackResult,
    source: "fallback",
  });
}

/** Non-NCR province and region keywords to reject */
const OUT_OF_NCR_PATTERN =
  /\b(cebu|davao|iloilo|bacolod|baguio|pampanga|laguna|cavite|batangas|bulacan|rizal|bicol|zamboanga|cagayan|pangasinan|tarlac|nueva ecija|palawan|boracay|mindanao|visayas)\b/i;

/**
 * Simple heuristic-based address validation.
 * Checks for minimum length, presence of a house number, and NCR locality.
 */
function textBasedValidation(address: string): {
  valid: boolean;
  message: string;
} {
  if (address.length < 10) {
    return {
      valid: false,
      message:
        "Address appears too short. Please provide a full street address.",
    };
  }

  // Expect at least one digit (house / building number)
  if (!/\d/.test(address)) {
    return {
      valid: false,
      message:
        "Address should include a house or building number.",
    };
  }

  // Check if address explicitly names a province/region outside NCR
  if (OUT_OF_NCR_PATTERN.test(address)) {
    return {
      valid: false,
      message:
        "Delivery is currently restricted to Metro Manila (NCR). Addresses outside NCR cannot be accepted.",
    };
  }

  return {
    valid: true,
    message:
      "Address accepted (external validation unavailable — verified by format only).",
  };
}
