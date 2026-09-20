import { cn } from "@/lib/utils";

interface DeliveryOverviewSkeletonProps {
  isActive?: boolean;
}

export function DeliveryOverviewSkeleton({ isActive }: DeliveryOverviewSkeletonProps) {
  return (
    <div className={cn(
      "w-full bg-[#FFFCF6] rounded-[16px] p-[20px] transition-colors border",
      isActive ? "border-[#1A1210]" : "border-[#1A1210]/20"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-[16px]">
        <div className="flex flex-col gap-1 w-1/2">
          <div className="h-[10px] w-12 bg-[#E3E8E1] rounded animate-pulse" />
          <div className="h-[22px] w-3/4 bg-[#E3E8E1] rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-1 w-1/3 items-end">
          <div className="h-[10px] w-16 bg-[#E3E8E1] rounded animate-pulse" />
          <div className="h-[18px] w-full bg-[#E3E8E1] rounded animate-pulse" />
        </div>
      </div>

      {/* Details */}
      <div className="mb-[16px] flex flex-col gap-2">
        <div className="h-[14px] w-full bg-[#E3E8E1] rounded animate-pulse" />
        <div className="h-[14px] w-2/3 bg-[#E3E8E1] rounded animate-pulse" />
        <div className="h-[12px] w-1/2 bg-[#E3E8E1] rounded animate-pulse mt-1" />
      </div>

      {/* Footer Actions */}
      <div className="pt-2">
        <div className="w-full h-[60px] rounded-[12px] bg-[#E3E8E1] animate-pulse" />
      </div>
    </div>
  );
}
