import { useState } from "react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import type { MenuItem } from "@/components/manage/menu/mock-menu";

interface MenuGridProps {
  searchText: string;
  selectedCategory: string;
  onEditItem: (item: MenuItem) => void;
  items: MenuItem[]; // ADDED: Accept live items from the parent page
  isLoading?: boolean; // ADDED: Loading state
}

export function MenuGrid({ searchText, selectedCategory, onEditItem, items, isLoading }: MenuGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter the live items passed in via props
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-[10px]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-[10px]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-start overflow-hidden rounded-[16px] border border-[#e3d6c3] bg-white">
                <div className="h-[160px] md:h-[181px] w-full shrink-0 bg-[#f6e9d9] animate-pulse" />
                <div className="flex flex-col gap-[5.4px] p-3 md:p-[14px] w-full text-left">
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="h-[18px] w-2/3 bg-[#efe6d8] rounded-full animate-pulse" />
                    <div className="h-[12px] w-8 bg-[#efe6d8] rounded-full animate-pulse" />
                  </div>
                  <div className="w-full flex-1 min-h-[34px] flex flex-col gap-1 mt-1">
                    <div className="h-[12px] w-full bg-[#efe6d8] rounded-full animate-pulse" />
                    <div className="h-[12px] w-4/5 bg-[#efe6d8] rounded-full animate-pulse" />
                  </div>
                  <div className="flex w-full items-end justify-end mt-auto pt-2">
                    <div className="h-[24px] w-16 bg-[#f6e9d9] rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="flex h-[200px] md:h-full items-center justify-center text-[15px] text-[#7a6a60]">
            No menu items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {paginatedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onEditItem(item)}
                className="flex flex-col items-start overflow-hidden rounded-[16px] border border-[#e3d6c3] bg-white transition-shadow hover:shadow-md"
              >
                {/* Image Display */}
                <div className="relative h-[160px] md:h-[181px] w-full shrink-0 bg-[#f6e9d9] overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-[5.4px] p-3 md:p-[14px] w-full text-left">
                  <div className="flex w-full items-start justify-between gap-2">
                    <h3 className="font-sans text-[15px] font-bold leading-[18px] text-[#1a1210]">
                      {item.name}
                    </h3>
                    <span className="shrink-0 text-[11px] text-[#7a6a60]">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full flex-1 min-h-[34px]">
                    <p className="line-clamp-2 text-[12px] leading-[16.8px] text-[#7a6a60]">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex w-full items-end justify-end mt-auto pt-2">
                    <span className="font-display text-[19px] leading-normal text-[#b8352a]">
                      ₱{item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pb-4 md:pb-[10px] pr-2 md:pr-[10px]">
        <ManagePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}