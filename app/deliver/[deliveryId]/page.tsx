import { notFound } from "next/navigation";
import { getDeliveryDetail } from "@/lib/actions/delivery";
import { DeliveryDetailsClient } from "@/components/deliver/delivery-details-client";
import { validateNcrAddress } from "@/lib/address/validate-ncr";

export default async function DeliveryDetailsPage({
  params,
}: {
  params: { deliveryId: string };
}) {
  const { deliveryId } = params;
  const { delivery: d, error } = await getDeliveryDetail(deliveryId);

  if (error || !d) {
    notFound();
  }

  let cardStatus: "ready" | "delivering" | "completed" = "ready";
  if (d.deliveryStatus === "delivering" || d.deliveryStatus === "out_for_delivery") cardStatus = "delivering";
  if (d.deliveryStatus === "delivered") cardStatus = "completed";

  let destLat = 14.6095;
  let destLng = 120.9942;

  if (d.customer?.address) {
    const cleanAddress = d.customer.address.replace(/#/g, "");
    const validation = await validateNcrAddress(cleanAddress);
    if (validation.latitude && validation.longitude) {
      destLat = validation.latitude;
      destLng = validation.longitude;
    }
  }

  const initialDelivery = {
    id: d.deliveryId,
    customer: d.customer?.name || "Walk-in Customer",
    address: d.customer?.address || "No address provided",
    phone: d.customer?.phone || "No phone provided",
    notes: "",
    paymentMethod: d.payment?.method || "Standard",
    total: d.payment?.total || 0,
    status: cardStatus,
    createdAt: d.createdAt || new Date().toISOString(),
    proofOfDelivery: d.proofOfDelivery,
    deliveryStatus: d.deliveryStatus,
    items: d.items.map((item) => ({
      qty: item.quantity,
      name: item.productName,
    })),
    origin: { lat: 14.5995, lng: 120.9842 },
    destination: { lat: destLat, lng: destLng },
    locationIqApiKey: process.env.LOCATIONIQ_API_KEY,
  };

  return <DeliveryDetailsClient initialDelivery={initialDelivery} />;
}