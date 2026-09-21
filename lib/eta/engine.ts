/**
 * ETA Calculation Engine
 * Factoring in real-time kitchen queue traffic, delivery distance, and NCR service boundary.
 * Reference: docs/requirements_audit.md (Browsing16, Issue #10)
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Yang's Fried Rice Malate Branch (default store origin) */
export const STORE_LOCATION: Coordinates = {
  latitude: parseFloat(process.env.RESTAURANT_LAT ?? "14.5694"),
  longitude: parseFloat(process.env.RESTAURANT_LNG ?? "120.9856"),
};

export const deliveryConfig = {
  MAX_DELIVERY_RADIUS_KM: 15,
  // TODO: confirm with the owner before launch; placeholders are intentionally easy to adjust.
  BASE_DELIVERY_FEE_PHP: 50,
  PER_KM_RATE_PHP: 10,
  MIN_DELIVERY_FEE_PHP: 50,
} as const;

/** Delivery service boundary radius in kilometers (strictly Metro Manila / NCR) */
export const MAX_DELIVERY_RADIUS_KM = deliveryConfig.MAX_DELIVERY_RADIUS_KM;
export const BASE_DELIVERY_FEE_PHP = deliveryConfig.BASE_DELIVERY_FEE_PHP;
export const PER_KM_RATE_PHP = deliveryConfig.PER_KM_RATE_PHP;
export const MIN_DELIVERY_FEE_PHP = deliveryConfig.MIN_DELIVERY_FEE_PHP;

/** Average urban motorcycle transit speed: 3 minutes per kilometer (~20 km/h) */
export const MINUTES_PER_KM = 3;

/** Driver dispatch and pickup preparation buffer in minutes */
export const DISPATCH_BUFFER_MINUTES = 5;

/** Base kitchen preparation time in minutes */
export const BASE_KITCHEN_PREP_MINUTES = 15;

/** Added kitchen prep time per active order ahead in queue */
export const MINUTES_PER_QUEUE_ORDER = 3;

/** Maximum kitchen prep cap */
export const MAX_KITCHEN_PREP_MINUTES = 60;

/** Default estimated transit time when coordinates are unavailable */
export const DEFAULT_TRANSIT_MINUTES = 15;

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula.
 * @returns Distance in kilometers, rounded to 2 decimal places.
 */
export function calculateHaversineDistanceKm(
  origin: Coordinates,
  destination: Coordinates,
): number {
  const hasValidOrigin =
    Number.isFinite(origin.latitude) &&
    Number.isFinite(origin.longitude) &&
    Math.abs(origin.latitude) <= 90 &&
    Math.abs(origin.longitude) <= 180;
  const hasValidDestination =
    Number.isFinite(destination.latitude) &&
    Number.isFinite(destination.longitude) &&
    Math.abs(destination.latitude) <= 90 &&
    Math.abs(destination.longitude) <= 180;

  if (!hasValidOrigin || !hasValidDestination) {
    return Number.NaN;
  }

  const R = 6371;
  const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
  const dLng = ((destination.longitude - origin.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.latitude * Math.PI) / 180) *
      Math.cos((destination.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Calculates estimated kitchen preparation time factoring in queue congestion.
 * @param activeOrdersAhead Count of active orders ahead in the queue.
 */
export function calculateKitchenPrepMinutes(activeOrdersAhead: number): number {
  const safeCount = Math.max(0, activeOrdersAhead);
  const total = BASE_KITCHEN_PREP_MINUTES + safeCount * MINUTES_PER_QUEUE_ORDER;
  return Math.min(MAX_KITCHEN_PREP_MINUTES, total);
}

/**
 * Calculates transit time based on distance and order type.
 */
export function calculateTransitMinutes(
  distanceKm: number | null,
  orderType: "delivery" | "take_out" | "dine_in"
): number {
  if (orderType === "take_out" || orderType === "dine_in") {
    return 0;
  }

  if (distanceKm === null || isNaN(distanceKm)) {
    return DEFAULT_TRANSIT_MINUTES;
  }

  return Math.round(DISPATCH_BUFFER_MINUTES + distanceKm * MINUTES_PER_KM);
}

/**
 * Checks if a given destination coordinate is within the NCR delivery boundary.
 */
export function isWithinNcrBoundary(
  destination: Coordinates,
  storeOrigin: Coordinates = STORE_LOCATION,
): { isDeliverable: boolean; distanceKm: number } {
  const distanceKm = calculateHaversineDistanceKm(storeOrigin, destination);
  const safeDistance = Number.isFinite(distanceKm) ? distanceKm : Number.POSITIVE_INFINITY;

  return {
    isDeliverable: safeDistance <= MAX_DELIVERY_RADIUS_KM,
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : Number.POSITIVE_INFINITY,
  };
}

export interface CalculateEtaParams {
  orderId: string;
  orderType: "delivery" | "take_out" | "dine_in";
  activeOrdersAhead: number;
  customerCoordinates?: Coordinates | null;
  storeCoordinates?: Coordinates;
  orderStatus?: string;
  deliveryStatus?: string;
}

export interface EtaResult {
  orderId: string;
  orderType: "delivery" | "take_out" | "dine_in";
  kitchenPrepMinutes: number;
  transitMinutes: number;
  totalEstimatedMinutes: number;
  arrivalWindow: string; // e.g. "25–35 mins"
  estimatedArrivalTimestamp: string; // ISO 8601 string
  distanceKm: number | null;
  activeOrdersAhead: number;
  isDeliverable: boolean;
  message?: string;
}

/**
 * Computes the full ETA breakdown for an order.
 */
export function calculateOrderEta({
  orderId,
  orderType,
  activeOrdersAhead,
  customerCoordinates,
  storeCoordinates = STORE_LOCATION,
  orderStatus,
  deliveryStatus,
}: CalculateEtaParams): EtaResult {
  let distanceKm: number | null = null;
  let isDeliverable = true;
  let message: string | undefined;

  // Check NCR boundary for delivery orders if coordinates are available
  if (orderType === "delivery" && customerCoordinates) {
    const boundaryCheck = isWithinNcrBoundary(customerCoordinates, storeCoordinates);
    distanceKm = boundaryCheck.distanceKm;
    isDeliverable = boundaryCheck.isDeliverable;

    if (!isDeliverable) {
      message = `Delivery is currently restricted to Metro Manila (NCR). Address is ${distanceKm} km away (maximum radius: ${MAX_DELIVERY_RADIUS_KM} km).`;
    }
  }

  // Completed orders have already arrived / been picked up: ETA is None
  const isCompleted =
    orderStatus === "completed" || deliveryStatus === "delivered";
  if (isCompleted) {
    const completedMessage =
      orderType === "delivery"
        ? "Order has been completed and delivered."
        : "Order has been completed and picked up.";
    return {
      orderId,
      orderType,
      kitchenPrepMinutes: 0,
      transitMinutes: 0,
      totalEstimatedMinutes: 0,
      arrivalWindow: "None",
      estimatedArrivalTimestamp: new Date().toISOString(),
      distanceKm,
      activeOrdersAhead: 0,
      isDeliverable,
      message: completedMessage,
    };
  }

  // Cancelled orders: ETA is None
  if (orderStatus === "cancelled") {
    return {
      orderId,
      orderType,
      kitchenPrepMinutes: 0,
      transitMinutes: 0,
      totalEstimatedMinutes: 0,
      arrivalWindow: "None",
      estimatedArrivalTimestamp: new Date().toISOString(),
      distanceKm,
      activeOrdersAhead: 0,
      isDeliverable,
      message: "Order was cancelled.",
    };
  }

  // If already delivering or ready, kitchen prep is finished
  const isAlreadyInTransit = deliveryStatus === "delivering";
  const isReady = orderStatus === "ready";

  const kitchenPrepMinutes =
    isReady || isAlreadyInTransit
      ? 0
      : calculateKitchenPrepMinutes(activeOrdersAhead);

  const transitMinutes = calculateTransitMinutes(distanceKm, orderType);

  const totalEstimatedMinutes = kitchenPrepMinutes + transitMinutes;

  // Arrival window range: [T - 5, T + 5] (minimum window lower bound is 5 mins)
  const windowLower = Math.max(5, totalEstimatedMinutes - 5);
  const windowUpper = totalEstimatedMinutes + 5;
  let arrivalWindow: string;

  if (orderType === "take_out" || orderType === "dine_in") {
    arrivalWindow = isReady
      ? "Ready for pickup"
      : `Ready in ${windowLower}–${windowUpper} mins`;
    if (isReady && !message) {
      message = "Your order is ready for pickup at the counter.";
    }
  } else {
    arrivalWindow = `${windowLower}–${windowUpper} mins`;
  }

  const now = new Date();
  const arrivalTime = new Date(now.getTime() + totalEstimatedMinutes * 60 * 1000);

  return {
    orderId,
    orderType,
    kitchenPrepMinutes,
    transitMinutes,
    totalEstimatedMinutes,
    arrivalWindow,
    estimatedArrivalTimestamp: arrivalTime.toISOString(),
    distanceKm,
    activeOrdersAhead,
    isDeliverable,
    message,
  };
}
