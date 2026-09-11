import { MenuCategory } from "@/components/manage/menu/mock-menu";
import { cn } from "@/lib/utils";

interface MenuSidebarProps {
  categories: MenuCategory[];
  selectedCategory: MenuCategory;
  onSelectCategory: (category: MenuCategory) => void;
}

export function MenuSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: MenuSidebarProps) {
  return (
    <div className="flex w-[202px] shrink-0 flex-col gap-[6px] overflow-hidden p-[10px]">
      {/* Header */}
      <div className="flex w-full shrink-0 flex-col items-start justify-center rounded-[10px] py-[5px]">
        <span className="text-[13px] font-bold text-[#7a6a60]">
          Categories
        </span>
      </div>

      {/* Categories List */}
      <div className="flex shrink-0 flex-col gap-[6px]">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={cn(
              "flex shrink-0 flex-col items-start justify-center rounded-[10px] py-[10px] pl-[12px] pr-[16px] transition-colors",
              selectedCategory === category
                ? "bg-[#f6e9d9] text-[#8c1c13]"
                : "text-[#5a4a42] hover:bg-black/5"
            )}
          >
            <span className="text-[13px] font-bold">{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
