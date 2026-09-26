import { Bike } from "lucide-react";
import Link from "next/link";
import { getAssignedDeliveries, getDeliveryDetail } from "@/lib/actions/delivery";
import { formatMobileNumber } from "@/lib/validation/phone";
import { DeliveryOverviewCard } from "@/components/deliver/delivery-overview-card";

export default async function DeliverHomePage() {
  // 1. Fetch the lightweight summaries
  const { deliveries, error } = await getAssignedDeliveries();

  if (error || !deliveries || deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#FAF5EB]/50 p-8 text-center">
        <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-[#DDCDB8]">
          <Bike className="w-12 h-12 text-[#E8541F]" />
        </div>
        <h2 className="font-display text-[24px] text-[#1A1210] mb-2">
          Ready to ride?
        </h2>
        <p className="text-[15px] text-[#7A6A60] max-w-[300px]">
          {error 
            ? `Failed to load data: ${error}` 
            : "You have no active deliveries in your queue. Stand by for assignments!"}
        </p>
      </div>
    );
  }

  // 2. Fetch the full details for each delivery so the cards have customer info
  const detailedPromises = deliveries.map(summary => getDeliveryDetail(summary.deliveryId));
  const detailedResults = await Promise.all(detailedPromises);

  // 3. Translate the backend Database schema into the UI's expected DeliveryData shape.
  //
  // One pass over the results, keeping the FULL delivery id. This used to
  // shorten the id for display and hand that shortened string to the card, so
  // "Accept" called acceptDelivery("A1B2C") — an id that matches nothing — and
  // filtering one list but indexing the other paired cards with the wrong link.
  const mappedDeliveries = detailedResults
    .flatMap((res) => (res.delivery ? [res.delivery] : []))
    .map((d) => {
      // Map PostgreSQL delivery statuses to the UI's specific layout states
      let cardStatus: "ready" | "delivering" | "completed" = "ready";
      if (d.deliveryStatus === "delivering" || d.deliveryStatus === "out_for_delivery") cardStatus = "delivering";
      if (d.deliveryStatus === "delivered") cardStatus = "completed";

      return {
        id: d.deliveryId,
        customer: d.customer?.name || "Walk-in Customer",
        address: d.customer?.address || "No address provided",
        phone: formatMobileNumber(d.customer?.phone) || "No phone provided",
        notes: d.deliveryNote ?? "",
        paymentMethod: d.payment?.method ?? "cash_on_delivery",
        total: d.payment?.total ?? 0,
        status: cardStatus,
        createdAt: d.createdAt ?? new Date().toISOString(),
        items: d.items.map((item) => ({
          qty: item.quantity,
          name: item.productName,
        })),
      };
    })
    .filter((d) => d.status !== "completed");

  if (mappedDeliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#FAF5EB]/50 p-8 text-center">
        <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-[#DDCDB8]">
          <Bike className="w-12 h-12 text-[#E8541F]" />
        </div>
        <h2 className="font-display text-[24px] text-[#1A1210] mb-2">Ready to ride?</h2>
        <p className="text-[15px] text-[#7A6A60] max-w-[300px]">
          No orders are waiting for delivery right now. New ones appear here as soon as the kitchen sends them out.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#FAF5EB]/50 p-4 md:p-8 overflow-y-auto">
      <h2 className="font-display text-[24px] text-[#1A1210] mb-1">
        Delivery Queue
      </h2>
      <p className="text-[13px] text-[#7A6A60] mb-6">
        Orders waiting for a rider, and the ones you&apos;ve accepted.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mappedDeliveries.map((delivery) => (
          <Link key={delivery.id} href={`/deliver/${delivery.id}`} className="block">
            <DeliveryOverviewCard delivery={delivery} />
          </Link>
        ))}
      </div>
    </div>
  );
}