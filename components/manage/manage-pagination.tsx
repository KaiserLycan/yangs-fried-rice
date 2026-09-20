import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

function getVisiblePages(current: number, total: number) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function ManagePagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize = 10,
  onPageSizeChange,
  className 
}: ManagePaginationProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className={cn("flex flex-col-reverse sm:flex-row items-center justify-between sm:justify-end gap-4 sm:gap-2", className)}>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[#7a6a60]">Show</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="flex h-[36px] items-center justify-center appearance-none rounded-full border border-[#DDCDB8] bg-white pl-4 pr-8 text-[13px] font-bold text-[#1A1210] outline-none focus:border-[#E8541F]"
            disabled={!onPageSizeChange}
          >
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown className="h-3 w-3 text-[#A2938A]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:ml-4 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#1A1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#DDCDB8]"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#1A1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#DDCDB8]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <div key={`ellipsis-${index}`} className="flex h-[36px] w-[36px] items-center justify-center text-[#DDCDB8]">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }

            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
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
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#1A1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#DDCDB8]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#1A1210] transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-[#DDCDB8]"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}