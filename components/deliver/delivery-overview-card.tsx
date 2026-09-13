import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DeliveryData } from "@/lib/mock-deliveries";

interface DeliveryOverviewCardProps {
  delivery: DeliveryData;
  isActive?: boolean;
}

export function DeliveryOverviewCard({ delivery, isActive }: DeliveryOverviewCardProps) {
  const isReady = delivery.status === "ready";
  const isDelivering = delivery.status === "delivering";
  const isCompleted = delivery.status === "completed";

  const itemCount = delivery.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={cn(
      "w-full bg-[#FFFCF6] rounded-[16px] p-[20px] transition-colors border",
      isActive ? "border-[#1A1210]" : "border-[#1A1210]/20 hover:border-[#1A1210]/50",
      delivery.status === "completed" && "opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-[16px]">
        <div>
          <p className="text-[10px] text-[#7A6A60] font-bold tracking-widest uppercase mb-1">ORDER</p>
          <h3 className="font-display text-[22px] text-[#1A1210] leading-none">
            #{delivery.id}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#7A6A60] font-bold tracking-widest uppercase mb-1">DELIVER TO</p>
          <h3 className="font-display text-[18px] text-[#1A1210] leading-none uppercase">
            {delivery.customer}
          </h3>
        </div>
      </div>

      {/* Details */}
      <div className="mb-[16px] flex flex-col gap-2">
        <p className="text-[14px] text-[#1A1210] leading-snug">
          {delivery.address} {delivery.notes}
        </p>
        <p className="text-[14px] text-[#1A1210]">
          {delivery.phone}
        </p>
        <p className="text-[12px] text-[#7A6A60] mt-1">
          {itemCount} items · {delivery.paymentMethod} · {delivery.total}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="pt-2">
        {isReady ? (
          <Button className="w-full py-5 rounded-[12px] bg-[#E8541F] hover:bg-[#d44919] text-white">
            Accept
          </Button>
        ) : (
          <Button className="w-full py-5 rounded-[12px] bg-[#1A1210] hover:bg-[#2c1f1c] text-white">
            Mark as delivered
          </Button>
        )}
      </div>
    </div>
  );
}
