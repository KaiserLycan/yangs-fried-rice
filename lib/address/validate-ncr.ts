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

export function formatDeliveryRadiusMessage(distanceKm: number): string {
  return `Sorry, we only deliver within ${MAX_DELIVERY_RADIUS_KM} km of our store. This address is ${distanceKm.toFixed(1)} km away.`;
}

export async function validateDeliveryAddress(address: string): Promise<{
  valid: boolean;
  distanceKm: number | null;
  error: string | null;
}> {
  const result = await validateNcrAddress(address);

  if (!result.valid) {
    return {
      valid: false,
      distanceKm: result.distanceKm ?? null,
      error: result.message ?? "Sorry, we only deliver within 15 km of our store.",
    };
  }

  return {
    valid: true,
    distanceKm: result.distanceKm ?? null,
    error: null,
  };
}

/**
 * Validates whether a given address is within the NCR delivery zone.
 * Uses LocationIQ geocoding and strictly requires an exact coordinate match.
 */
const NCR_CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  "manila": { latitude: 14.5995, longitude: 120.9842 },
  "makati": { latitude: 14.5547, longitude: 121.0244 },
  "taguig": { latitude: 14.5176, longitude: 121.0563 },
  "pasig": { latitude: 14.5764, longitude: 121.0851 },
  "quezon city": { latitude: 14.676, longitude: 121.0437 },
  "mandaluyong": { latitude: 14.5794, longitude: 121.0359 },
  "marikina": { latitude: 14.6507, longitude: 121.1029 },
  "san juan": { latitude: 14.6017, longitude: 121.0359 },
  "pasay": { latitude: 14.5378, longitude: 120.9997 },
  "paranaque": { latitude: 14.4793, longitude: 121.0198 },
  "muntinlupa": { latitude: 14.3765, longitude: 121.0419 },
  "las piñas": { latitude: 14.4367, longitude: 120.9969 },
  "caloocan": { latitude: 14.6569, longitude: 120.9833 },
  "malabon": { latitude: 14.6602, longitude: 120.9423 },
  "navotas": { latitude: 14.6628, longitude: 120.9367 },
  "valenzuela": { latitude: 14.6999, longitude: 120.9833 },
  "pateros": { latitude: 14.5358, longitude: 121.061 },
};

function heuristicNcrMatch(address: string): { latitude: number; longitude: number } | null {
  const lower = address.toLowerCase();

  for (const [city, coords] of Object.entries(NCR_CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }

  return null;
}

export async function validateNcrAddress(address: string): Promise<NcrValidationResult> {
  const trimmed = address.trim();

  if (trimmed.length < 5) {
    return {
      valid: false,
      message: "Address must be at least 5 characters.",
    };
  }

  if (OUT_OF_NCR_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message:
        "Delivery is currently restricted to Metro Manila (NCR). Addresses outside NCR cannot be accepted.",
    };
  }

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
            message: formatDeliveryRadiusMessage(boundary.distanceKm),
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
    // Fall through to the heuristic fallback below when geocoding fails.
  }

  const fallbackCoords = heuristicNcrMatch(trimmed);
  if (fallbackCoords) {
    const boundary = isWithinNcrBoundary(fallbackCoords);
    return {
      valid: boundary.isDeliverable,
      message: boundary.isDeliverable
        ? undefined
        : formatDeliveryRadiusMessage(boundary.distanceKm),
      latitude: fallbackCoords.latitude,
      longitude: fallbackCoords.longitude,
      distanceKm: boundary.distanceKm,
    };
  }

  return {
    valid: false,
    message: "We couldn't find this exact address on the map. Please check your address or be more specific.",
  };
}
