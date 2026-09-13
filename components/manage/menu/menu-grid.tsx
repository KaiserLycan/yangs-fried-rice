import { MOCK_MENU_ITEMS, MenuItem } from "@/components/manage/menu/mock-menu";
import { ManagePagination } from "@/components/manage/manage-pagination";
import Image from "next/image";

interface MenuGridProps {
  searchText: string;
  selectedCategory: string;
  onEditItem: (item: MenuItem) => void;
}

export function MenuGrid({ searchText, selectedCategory, onEditItem }: MenuGridProps) {
  // Filter items
  const filteredItems = MOCK_MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-[10px]">
      {/* Grid container with overflow auto */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-[10px]">
        {filteredItems.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[15px] text-[#7a6a60]">
            No menu items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onEditItem(item)}
                className="flex flex-col items-start overflow-hidden rounded-[16px] border border-[#e3d6c3] bg-white transition-shadow hover:shadow-md"
              >
                {/* Image Placeholder */}
                <div className="relative h-[181px] w-full shrink-0 bg-[#f6e9d9]">
                  {/* We use a colored block since we don't have real images yet */}
                  {/* Replace with real next/image when available */}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-[5.4px] p-[14px] w-full text-left">
                  {/* Header: Title and Rating */}
                  <div className="flex w-full items-start justify-between gap-2">
                    <h3 className="font-sans text-[15px] font-bold leading-[18px] text-[#1a1210]">
                      {item.name}
                    </h3>
                    <span className="shrink-0 text-[11px] text-[#7a6a60]">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="w-full flex-1 min-h-[34px]">
                    <p className="line-clamp-2 text-[12px] leading-[16.8px] text-[#7a6a60]">
                      {item.description}
                    </p>
                  </div>

                  {/* Price */}
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

      {/* Pagination (Static Mock for now, matching Figma) */}
      <div className="pb-[10px] pr-[10px]">
        <ManagePagination 
          currentPage={1} 
          totalPages={3} 
          onPageChange={() => {}} 
        />
      </div>
    </div>
  );
}
