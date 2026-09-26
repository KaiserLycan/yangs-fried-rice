import { Bike } from "lucide-react";
import Link from "next/link";
import { getAssignedDeliveries, getDeliveryDetailsBatch } from "@/lib/actions/delivery";
import { activeCountOf, queueRank, toDeliveryCard } from "@/lib/orders/rider-queue";
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

  // 2. Fetch the full details in one batch — the same read and the same
  // mapping the sidebar uses, so every rider sees the same queue (P45).
  // `getDeliveryDetail` refused another rider's delivery, which is why
  // taken orders used to vanish from this page.
  const { deliveries: details } = await getDeliveryDetailsBatch(
    deliveries.map((summary) => summary.deliveryId),
  );
  const activeCount = activeCountOf(deliveries);

  const mappedDeliveries = [...deliveries]
    .sort((a, b) => queueRank(a) - queueRank(b))
    .flatMap((summary) => {
      const detail = details.find((d) => d.deliveryId === summary.deliveryId);
      return detail ? [toDeliveryCard(detail, summary, activeCount)] : [];
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
        Every order out for delivery. Ones another rider took show who has them.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mappedDeliveries.map((delivery) =>
          // Another rider's delivery has no detail page this rider may open.
          delivery.takenBy ? (
            <DeliveryOverviewCard key={delivery.id} delivery={delivery} />
          ) : (
            <Link key={delivery.id} href={`/deliver/${delivery.id}`} className="block">
              <DeliveryOverviewCard delivery={delivery} />
            </Link>
          ),
        )}
      </div>
    </div>
  );
}