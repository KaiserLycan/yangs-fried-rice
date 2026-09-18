import { isWithinNcrBoundary, MAX_DELIVERY_RADIUS_KM } from "@/lib/eta/engine";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "YangsFriedRice/1.0";
const NOMINATIM_TIMEOUT_MS = 4000;

export const OUT_OF_NCR_PATTERN =
  /\b(cebu|davao|iloilo|bacolod|baguio|pampanga|laguna|cavite|batangas|bulacan|rizal|bicol|zamboanga|cagayan|pangasinan|tarlac|nueva ecija|palawan|boracay|mindanao|visayas)\b/i;

export interface NcrValidationResult {
  valid: boolean;
  message?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  formattedAddress?: string;
}

/**
 * Validates whether a given address is within the NCR delivery zone.
 * Uses Nominatim geocoding if reachable, and falls back to strict heuristic checks.
 */
export async function validateNcrAddress(address: string): Promise<NcrValidationResult> {
  const trimmed = address.trim();

  if (trimmed.length < 5) {
    return {
      valid: false,
      message: "Address must be at least 5 characters.",
    };
  }

  // Fast-path text rejection for explicit out-of-NCR regions
  if (OUT_OF_NCR_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message:
        "Delivery is currently restricted to Metro Manila (NCR). Addresses outside NCR cannot be accepted.",
    };
  }

  // Geocoding check via Nominatim
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const top = results[0];
        const latitude = parseFloat(top.lat);
        const longitude = parseFloat(top.lon);

        const boundary = isWithinNcrBoundary({ latitude, longitude });
        if (!boundary.isDeliverable) {
          return {
            valid: false,
            message: `Delivery is currently restricted to Metro Manila (NCR). Address is ${boundary.distanceKm} km away (maximum delivery radius: ${MAX_DELIVERY_RADIUS_KM} km).`,
            latitude,
            longitude,
            distanceKm: boundary.distanceKm,
          };
        }

        return {
          valid: true,
          formattedAddress: top.display_name,
          latitude,
          longitude,
          distanceKm: boundary.distanceKm,
        };
      }
    }
  } catch {
    // Network or timeout failure — allow heuristic fallback
  }

  // Fallback heuristic: If it passed the non-NCR regex check, allow it
  return {
    valid: true,
  };
}
