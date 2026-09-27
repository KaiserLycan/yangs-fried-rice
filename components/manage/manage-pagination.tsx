import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    <div className={cn("flex w-full max-w-full flex-col-reverse items-center gap-3 md:w-auto md:flex-row md:justify-end md:gap-2", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="flex h-[36px] items-center justify-center appearance-none rounded-full border border-field-border bg-white pl-4 pr-8 text-sm font-bold text-foreground outline-none focus:border-accent"
            disabled={!onPageSizeChange}
          >
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown className="h-3 w-3 text-placeholder" />
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-1 md:ml-4 md:w-auto md:justify-start">
        <div className="flex items-center gap-1">
          <Button variant="unstyled"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-foreground transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-field-border"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="unstyled"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-foreground transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-field-border"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Phones and narrow panes: a compact "Page 2 of 7" between the arrows.
            Seven 36px number buttons plus four arrows is ~400px, wider than the
            content area next to the sidebar, and pushed "next" off the screen. */}
        <span className="min-w-[88px] px-1 text-center text-sm font-bold text-foreground md:hidden">
          Page {Math.min(Math.max(1, currentPage), Math.max(1, totalPages))} of {Math.max(1, totalPages)}
        </span>

        {/* Page Numbers — wider screens */}
        <div className="hidden items-center gap-1 md:flex">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <div key={`ellipsis-${index}`} className="flex h-[36px] w-[36px] items-center justify-center text-field-border">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }

            const isActive = currentPage === page;
            return (
              <Button variant="unstyled"
                key={page}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "flex h-[36px] w-[36px] items-center justify-center rounded-full transition-colors hover:bg-black/5 text-sm",
                  isActive
                    ? "bg-white text-foreground font-bold border border-field-border"
                    : "text-muted-foreground font-medium"
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="unstyled"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-foreground transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-field-border"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="unstyled"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-foreground transition-colors hover:bg-black/5 disabled:opacity-50 disabled:pointer-events-none disabled:text-field-border"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}