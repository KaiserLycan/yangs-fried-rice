import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/lib/menu/fetch-menu";

/**
 * Mobile's horizontally scrolling category row (`132:110`) — the same
 * All-plus-categories selection as the desktop sidebar, drawn as a chip row
 * instead of a vertical list because there's no 208px rail to put it in.
 */
export function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: CategoryOption[];
  selected: string | null;
  onSelect: (categoryName: string | null) => void;
}) {
  return (
    <div className="flex gap-[8px] overflow-x-auto px-[20px] py-[9px] md:hidden">
      <ChipButton
        label="All"
        isSelected={selected === null}
        onClick={() => onSelect(null)}
      />
      {categories.map((category) => (
        <ChipButton
          key={category.id}
          label={category.name}
          isSelected={selected === category.name}
          onClick={() => onSelect(category.name)}
        />
      ))}
    </div>
  );
}

function ChipButton({
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
        "shrink-0 whitespace-nowrap rounded-pill px-[15px] py-[9px] text-[13.5px]",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary/40 text-foreground",
      )}
    >
      {label}
    </button>
  );
}
