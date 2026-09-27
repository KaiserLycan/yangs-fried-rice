import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SortDirection = "asc" | "desc" | "none";

interface SortableHeaderProps {
  label: string;
  currentSort: SortDirection;
  onSortChange: (newSort: SortDirection) => void;
  className?: string;
}

export function SortableHeader({
  label,
  currentSort,
  onSortChange,
  className = "",
}: SortableHeaderProps) {
  const toggleSort = () => {
    if (currentSort === "none") return onSortChange("asc");
    if (currentSort === "asc") return onSortChange("desc");
    return onSortChange("none");
  };

  return (
    <Button variant="unstyled"
      className={`flex items-center gap-2 hover:text-muted-strong transition-colors focus:outline-none w-fit ${className}`}
      onClick={toggleSort}
    >
      {label}
      {currentSort === "asc" ? (
        <ChevronUp className="h-[14px] w-[14px]" />
      ) : currentSort === "desc" ? (
        <ChevronDown className="h-[14px] w-[14px]" />
      ) : (
        <ChevronsUpDown className="h-[14px] w-[14px]" />
      )}
    </Button>
  );
}
