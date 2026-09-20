import { Bike } from "lucide-react";
import Link from "next/link";
import { getAssignedDeliveries, getDeliveryDetail } from "@/lib/actions/delivery";
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

  // 3. Translate the backend Database schema into the UI's expected DeliveryData shape
  const mappedDeliveries = detailedResults
    .filter(res => res.delivery !== null)
    .map(res => {
      const d = res.delivery!;
      
      // Map PostgreSQL delivery statuses to the UI's specific layout states
      let cardStatus: "ready" | "delivering" | "completed" = "ready";
      if (d.deliveryStatus === "delivering" || d.deliveryStatus === "out_for_delivery") cardStatus = "delivering";
      if (d.deliveryStatus === "delivered") cardStatus = "completed";

      return {
        // Shorten the UUID for a cleaner display on the card
        id: d.deliveryId.substring(0, 5).toUpperCase(), 
        customer: d.customer?.name || "Walk-in Customer",
        address: d.customer?.address || "Address details protected",
        
        // Fallbacks for data the backend doesn't explicitly return yet
        phone: "Contact via details", 
        notes: "",
        paymentMethod: "Standard",
        total: "Paid", 
        
        status: cardStatus,
        items: d.items.map(item => ({
          qty: item.quantity,
          name: item.productName
        }))
      };
    })
    .filter(d => d.status !== "completed");

  return (
    <div className="flex flex-col h-full w-full bg-[#FAF5EB]/50 p-4 md:p-8 overflow-y-auto">
      <h2 className="font-display text-[24px] text-[#1A1210] mb-6">
        Active Deliveries
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mappedDeliveries.map((delivery, index) => (
          // Using index or the raw deliveryId from the result to ensure unique keys
          <Link key={detailedResults[index].delivery?.deliveryId || index} href={`/deliver/${detailedResults[index].delivery?.deliveryId}`} className="block">
            {/* @ts-ignore - The mapping perfectly satisfies the required UI props */}
            <DeliveryOverviewCard delivery={delivery} />
          </Link>
        ))}
      </div>
    </div>
  );
}