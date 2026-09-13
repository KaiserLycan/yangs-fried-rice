import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function OrderPagination({ currentPage, totalPages, onPageChange }: OrderPaginationProps) {
  return (
    <div className="flex items-center justify-end gap-4 mt-6">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <span>Show</span>
        <div className="bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-100 font-semibold text-black">
          10
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="bg-white p-2 rounded-md shadow-sm border border-gray-100 text-gray-400 hover:text-black disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="bg-white p-2 rounded-md shadow-sm border border-gray-100 text-gray-400 hover:text-black disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors",
                currentPage === page
                  ? "bg-white shadow-sm border border-gray-100 text-black"
                  : "text-gray-500 hover:bg-white hover:text-black"
              )}
            >
              {page}
            </button>
          );
        })}

        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="bg-white p-2 rounded-md shadow-sm border border-gray-100 text-gray-400 hover:text-black disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="bg-white p-2 rounded-md shadow-sm border border-gray-100 text-gray-400 hover:text-black disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
