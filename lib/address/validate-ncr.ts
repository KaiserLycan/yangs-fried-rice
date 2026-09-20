import { isWithinNcrBoundary, MAX_DELIVERY_RADIUS_KM } from "@/lib/eta/engine";

const LOCATIONIQ_URL = "https://us1.locationiq.com/v1/search";
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
 * Uses LocationIQ geocoding and strictly requires an exact coordinate match.
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

  // Geocoding check via LocationIQ
  try {
    const url = new URL(LOCATIONIQ_URL);
    url.searchParams.set("key", process.env.LOCATIONIQ_API_KEY || "");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

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

        // Strict validation: Reject if LocationIQ only matched the city/state
        // It must have matched a road, neighbourhood, suburb, or building.
        const addr = top.address || {};
        if (!addr.road && !addr.neighbourhood && !addr.suburb && !addr.residential && !addr.building && !addr.pedestrian && !addr.quarter) {
          return {
            valid: false,
            message: "We couldn't find your specific street. Please check for typos in the street name.",
          };
        }

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
    // Network or timeout failure, or invalid response
  }

  // Strict validation: if we reach here, we didn't get coordinates
  return {
    valid: false,
    message: "We couldn't find this exact address on the map. Please check your address or be more specific."
  };
}
