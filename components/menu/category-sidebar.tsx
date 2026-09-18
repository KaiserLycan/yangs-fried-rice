import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/lib/menu/fetch-menu";

/**
 * Desktop's 208px category rail (`133:770`): a heading, "All" plus every
 * category, and a branch status block beneath them.
 *
 * `selected` is a category name or `null` for "All" — the products API
 * filters by `category_name`, not an id (see `fetch-menu.ts`'s own
 * comment), so carrying the name through here avoids a second lookup from
 * id back to name right before the request is made.
 */
export function CategorySidebar({
  categories,
  selected,
  onSelect,
}: {
  categories: CategoryOption[];
  selected: string | null;
  onSelect: (categoryName: string | null) => void;
}) {
  return (
    <aside className="hidden w-[208px] shrink-0 flex-col md:flex">
      <h2 className="px-[18px] pt-[24px] text-[13px] font-bold uppercase tracking-[0.5px] text-foreground">
        Categories
      </h2>

      <nav className="mt-[15px] flex flex-col gap-[6px] px-[18px]">
        <CategoryButton
          label="All"
          isSelected={selected === null}
          onClick={() => onSelect(null)}
        />
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            label={category.name}
            isSelected={selected === category.name}
            onClick={() => onSelect(category.name)}
          />
        ))}
      </nav>

    </aside>
  );
}

function CategoryButton({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        "rounded-md px-[12px] py-[10px] text-left text-[13.5px]",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-secondary/40",
      )}
    >
      {label}
    </button>
  );
}
