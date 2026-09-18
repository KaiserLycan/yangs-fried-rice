export type DeliveryTab = "all" | "queue" | "delivered";

export function resolveDeliveryTab(status: string | null): DeliveryTab {
  if (status === "delivered") return "delivered";
  if (status === "out_for_delivery" || status === "delivering") return "queue";
  return "all";
}

export function matchesDeliveryTab(status: string | null, tab: DeliveryTab): boolean {
  return resolveDeliveryTab(status) === tab;
}
