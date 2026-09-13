import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function ManagePagination({ currentPage, totalPages, onPageChange, className }: ManagePaginationProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <span className="text-[13px] text-[#7a6a60]">Show</span>
      <div className="flex h-8 w-[50px] items-center justify-center rounded-[8px] border border-[#ddcdb8] bg-white">
        <span className="text-[13px] font-bold text-[#1a1210]">10</span>
      </div>
      
      <div className="flex items-center gap-1 ml-4">
        <button 
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[#ddcdb8] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[#ddcdb8] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none"
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
                "flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-black/5",
                isActive 
                  ? "bg-white text-[#1a1210] font-bold border border-[#ddcdb8]"
                  : "text-[#7a6a60]"
              )}
            >
              {page}
            </button>
          );
        })}
        
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[#1a1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#ddcdb8]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button 
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[#1a1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#ddcdb8]"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
