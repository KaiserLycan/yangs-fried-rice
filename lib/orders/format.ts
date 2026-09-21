/**
 * Human labels for stored order values. The database keeps machine spellings
 * ("take_out", "out_for_delivery"); staff and customers should never read them.
 */

const ORDER_TYPE_LABELS: Record<string, string> = {
  take_out: "Take Out",
  takeout: "Take Out",
  pickup: "Pickup",
  pick_up: "Pickup",
  dine_in: "Dine In",
  delivery: "Delivery",
};

/** "take_out" → "Take Out". Unknown values are title-cased rather than shown raw. */
export function formatOrderType(type: string | null | undefined): string {
  if (!type) return "Take Out";
  const key = type.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (ORDER_TYPE_LABELS[key]) return ORDER_TYPE_LABELS[key];

  return key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Is this a delivery order (as opposed to take-out / dine-in)? */
export function isDeliveryOrder(type: string | null | undefined): boolean {
  return (type ?? "").trim().toLowerCase() === "delivery";
}

const PICKUP_TYPES = new Set(["pickup", "pick_up", "takeout", "take_out"]);

/**
 * Is this an order the customer collects (take-out / pickup)? Anything else —
 * including a missing type — is treated as a delivery, matching the frames.
 * The one definition the tracking screen, the order history and the staff
 * screens share, so "Ready for pick up" and "Delivering" can't disagree.
 */
export function isPickupOrder(type: string | null | undefined): boolean {
  if (!type) return false;
  return PICKUP_TYPES.has(type.trim().toLowerCase().replace(/[\s-]+/g, "_"));
}
