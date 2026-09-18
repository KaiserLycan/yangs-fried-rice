import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function ManagePagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize = 10,
  onPageSizeChange,
  className 
}: ManagePaginationProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <span className="text-[13px] text-[#7a6a60]">Show</span>
      <div className="relative">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="flex h-[36px] items-center justify-center appearance-none rounded-full border border-[#DDCDB8] bg-white pl-4 pr-8 text-[13px] font-bold text-[#1A1210] outline-none focus:border-[#E8541F]"
          disabled={!onPageSizeChange}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <ChevronDown className="h-3 w-3 text-[#A2938A]" />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#DDCDB8] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#DDCDB8] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "flex h-[36px] w-[36px] items-center justify-center rounded-full transition-colors hover:bg-black/5 text-[14px]",
                isActive
                  ? "bg-white text-[#1A1210] font-bold border border-[#DDCDB8]"
                  : "text-[#7A6A60] font-medium"
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#1A1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#DDCDB8]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#1A1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#DDCDB8]"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
