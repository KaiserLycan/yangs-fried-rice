import {
  calculateHaversineDistanceKm,
  isWithinNcrBoundary,
  MAX_DELIVERY_RADIUS_KM,
  STORE_LOCATION,
  type Coordinates,
} from "@/lib/eta/engine";

/**
 * The ONE address validator. Sign-up, the address forms, checkout, the fee
 * calculation and `POST /api/address/validate` (the note under the form) all
 * go through `validateNcrAddress`, so they can no longer disagree.
 *
 * Two separate validators used to answer the same question — a lenient one
 * behind the note under the form and a strict, key-only one on submit — which
 * is how a form could say "Address validated" and then refuse to sign the
 * person up.
 *
 * How it decides, in order:
 *  1. Too short, or names a province outside NCR  -> rejected.
 *  2. Geocode it (LocationIQ if LOCATIONIQ_API_KEY is set, otherwise the free
 *     OpenStreetMap Nominatim). Any hit is accepted — street, barangay or city
 *     level is enough — and the distance from the store decides whether it is
 *     inside the delivery radius.
 *  3. No hit, or the service is down/unreachable -> fall back to the city
 *     named in the address. A recognised NCR city is accepted, with an
 *     approximate distance from that city's centre (good enough to price the
 *     delivery fee). No recognisable NCR city -> rejected.
 *
 * Callers should pass street, barangay, city and ZIP — NOT the house or
 * building number. "B10 L10 Camella Homes" is a lot inside a subdivision; no
 * map has it, and including it makes the geocoder miss the street it sits on.
 */

const LOCATIONIQ_URL = "https://us1.locationiq.com/v1/search";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "YangsFriedRice/1.0";
const GEOCODE_TIMEOUT_MS = 2500;
/** Total time the geocoding tries may take before falling back to the city. */
const GEOCODE_BUDGET_MS = 6000;
/** Coarser and coarser tries, so one unmatched detail doesn't sink the lookup. */
const MAX_GEOCODE_ATTEMPTS = 3;

export const OUT_OF_NCR_PATTERN =
  /\b(cebu|davao|iloilo|bacolod|baguio|pampanga|laguna|cavite|batangas|bulacan|rizal(?!\s+(?:ave|avenue|st|street|blvd|boulevard|extension|ext)\b)|bicol|zamboanga|cagayan|pangasinan|tarlac|nueva ecija|palawan|boracay|mindanao|visayas)\b/i;

/**
 * NCR's 17 cities/municipality with a rough centre each. Used only when the
 * geocoder can't answer, to accept the address and estimate its distance.
 * More specific names come first (e.g. "Pasig" before the generic "Manila",
 * which also appears in "Metro Manila").
 */
const NCR_CITY_CENTERS: { pattern: RegExp; latitude: number; longitude: number }[] = [
  { pattern: /\bquezon\s+city\b|\bq\.?c\.?\b/i, latitude: 14.676, longitude: 121.0437 },
  { pattern: /\bsan\s+juan\b/i, latitude: 14.6019, longitude: 121.0355 },
  { pattern: /\bmandaluyong\b/i, latitude: 14.5794, longitude: 121.0359 },
  { pattern: /\bpasig\b/i, latitude: 14.5764, longitude: 121.0851 },
  { pattern: /\bmakati\b/i, latitude: 14.5547, longitude: 121.0244 },
  { pattern: /\btaguig\b|\bbgc\b/i, latitude: 14.5176, longitude: 121.0509 },
  { pattern: /\bpateros\b/i, latitude: 14.5443, longitude: 121.0688 },
  { pattern: /\bpasay\b/i, latitude: 14.5378, longitude: 121.0014 },
  { pattern: /\bpara[ñn]aque\b/i, latitude: 14.4793, longitude: 121.0198 },
  { pattern: /\blas\s+pi[ñn]as\b/i, latitude: 14.4445, longitude: 120.9939 },
  { pattern: /\bmuntinlupa\b/i, latitude: 14.4081, longitude: 121.0415 },
  { pattern: /\bmarikina\b/i, latitude: 14.6507, longitude: 121.1029 },
  { pattern: /\bcaloocan\b/i, latitude: 14.65, longitude: 120.983 },
  { pattern: /\bmalabon\b/i, latitude: 14.6625, longitude: 120.9569 },
  { pattern: /\bnavotas\b/i, latitude: 14.6667, longitude: 120.9417 },
  { pattern: /\bvalenzuela\b/i, latitude: 14.7011, longitude: 120.983 },
  { pattern: /\bmanila\b|\bmetro\s+manila\b|\bncr\b/i, latitude: 14.5995, longitude: 120.9842 },
];

export type NcrRejection = "too_short" | "out_of_area" | "too_far";

export interface NcrValidationResult {
  valid: boolean;
  message?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  formattedAddress?: string;
  /**
   * "geocoder" — located on the map. "estimate" — the geocoder couldn't be
   * used, so it was accepted by its city and the distance is approximate.
   */
  source?: "geocoder" | "estimate";
  /** Why an address was refused, when it was. */
  reason?: NcrRejection;
}

/**
 * "Mercedes Ave., San Miguel, Pasig 1600" ->
 *   ["Mercedes Ave., San Miguel, Pasig 1600", "San Miguel, Pasig 1600", "Pasig 1600"]
 * so a street the map doesn't know still resolves at barangay or city level.
 */
function geocodeCandidates(address: string): string[] {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const candidates: string[] = [];
  for (let i = 0; i < parts.length && candidates.length < MAX_GEOCODE_ATTEMPTS; i++) {
    candidates.push(parts.slice(i).join(", "));
  }
  return candidates.length > 0 ? candidates : [address];
}

async function geocodeOnce(
  query: string,
): Promise<{ latitude: number; longitude: number; displayName?: string } | null> {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  const url = new URL(apiKey ? LOCATIONIQ_URL : NOMINATIM_URL);
  if (apiKey) url.searchParams.set("key", apiKey);
  url.searchParams.set("q", `${query}, Philippines`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ph");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const latitude = parseFloat(results[0].lat);
    const longitude = parseFloat(results[0].lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude, displayName: results[0].display_name };
  } catch {
    // Network failure, timeout or a bad response: treated as "no answer".
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function tooFarResult(
  coordinates: Coordinates,
  distanceKm: number,
  source: NcrValidationResult["source"],
): NcrValidationResult {
  return {
    valid: false,
    reason: "too_far",
    message: `Delivery is currently restricted to Metro Manila (NCR). This address is about ${distanceKm} km away (maximum delivery radius: ${MAX_DELIVERY_RADIUS_KM} km).`,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    distanceKm,
    source,
  };
}

/**
 * Validates whether an address is inside the delivery zone.
 * See the file comment for the rules; pass street, barangay, city and ZIP.
 */
export async function validateNcrAddress(address: string): Promise<NcrValidationResult> {
  const trimmed = address.trim();

  if (trimmed.length < 5) {
    return {
      valid: false,
      reason: "too_short",
      message: "Address must be at least 5 characters.",
    };
  }

  // Fast-path text rejection for explicit out-of-NCR regions
  if (OUT_OF_NCR_PATTERN.test(trimmed)) {
    return {
      valid: false,
      reason: "out_of_area",
      message:
        "Delivery is currently restricted to Metro Manila (NCR). Addresses outside NCR cannot be accepted.",
    };
  }

  // 1. Geocode, coarser on each retry, within an overall time budget.
  const startedAt = Date.now();
  for (const candidate of geocodeCandidates(trimmed)) {
    if (Date.now() - startedAt > GEOCODE_BUDGET_MS) break;
    const hit = await geocodeOnce(candidate);
    if (!hit) continue;

    const coordinates = { latitude: hit.latitude, longitude: hit.longitude };
    const boundary = isWithinNcrBoundary(coordinates);
    if (!boundary.isDeliverable) {
      return tooFarResult(coordinates, boundary.distanceKm, "geocoder");
    }

    return {
      valid: true,
      source: "geocoder",
      formattedAddress: hit.displayName,
      latitude: hit.latitude,
      longitude: hit.longitude,
      distanceKm: boundary.distanceKm,
    };
  }

  // 2. The map had no answer (or couldn't be reached). Fall back to the city.
  const city = NCR_CITY_CENTERS.find(({ pattern }) => pattern.test(trimmed));
  if (city) {
    const coordinates = { latitude: city.latitude, longitude: city.longitude };
    const distanceKm = calculateHaversineDistanceKm(STORE_LOCATION, coordinates);
    if (Number.isFinite(distanceKm) && distanceKm > MAX_DELIVERY_RADIUS_KM) {
      return tooFarResult(coordinates, distanceKm, "estimate");
    }
    return { valid: true, source: "estimate", distanceKm, ...coordinates };
  }

  return {
    valid: false,
    reason: "out_of_area",
    message:
      "We can only deliver within Metro Manila (NCR). Please check that the city is spelled correctly (e.g. Pasig, Makati, Quezon City).",
  };
}

/**
 * A reason to refuse saving this address, or null if it is fine to save.
 * Refuses exactly what `validateNcrAddress` rejects for being outside the
 * delivery area or radius.
 */
export async function outsideDeliveryRadiusMessage(
  address: string,
): Promise<string | null> {
  const result = await validateNcrAddress(address);
  if (result.valid) return null;
  if (result.reason === "too_far" || result.reason === "out_of_area") {
    return (
      result.message ??
      `We only deliver within ${MAX_DELIVERY_RADIUS_KM} km of the store.`
    );
  }
  return null;
}

// Kept in its own module so client components can use it without pulling in
// the server-side geocoding code.
export { addressForGeocoding } from "./geocoding-query";
