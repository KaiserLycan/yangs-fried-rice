import { notFound } from "next/navigation";
import { getDeliveryDetail } from "@/lib/actions/delivery";
import { DeliveryDetailsClient } from "@/components/deliver/delivery-details-client";

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

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress + ", Metro Manila, Philippines")}&limit=1`,
        { cache: "no-store" }
      );
      const geoData = await res.json();

      if (geoData && geoData.length > 0) {
        destLat = parseFloat(geoData[0].lat);
        destLng = parseFloat(geoData[0].lon);
      } else {
        const lowerAddress = cleanAddress.toLowerCase();
        let city = "Manila";

        if (lowerAddress.includes("makati")) city = "Makati";
        else if (lowerAddress.includes("taguig")) city = "Taguig";
        else if (lowerAddress.includes("quezon city") || lowerAddress.includes("qc")) city = "Quezon City";
        else if (lowerAddress.includes("pasig")) city = "Pasig";
        else if (lowerAddress.includes("paranaque")) city = "Parañaque";
        else if (lowerAddress.includes("pasay")) city = "Pasay";

        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ", Metro Manila, Philippines")}&limit=1`,
          { cache: "no-store" }
        );
        const fallbackData = await fallbackRes.json();

        if (fallbackData && fallbackData.length > 0) {
          destLat = parseFloat(fallbackData[0].lat);
          destLng = parseFloat(fallbackData[0].lon);
        }
      }
    } catch {
      // Keep the Manila fallback if geocoding fails.
    }
  }

  const initialDelivery = {
    id: d.deliveryId,
    customer: d.customer?.name || "Walk-in Customer",
    address: d.customer?.address || "No address provided",
    phone: d.customer?.phone || "No phone provided",
    notes: "",
    paymentMethod: "Standard",
    total: 0,
    status: cardStatus,
    proofOfDelivery: d.proofOfDelivery,
    deliveryStatus: d.deliveryStatus,
    items: d.items.map((item) => ({
      qty: item.quantity,
      name: item.productName,
    })),
    origin: { lat: 14.5995, lng: 120.9842 },
    destination: { lat: destLat, lng: destLng },
  };

  return <DeliveryDetailsClient initialDelivery={initialDelivery} />;
}