/**
 * What renders instead of the grid or the list when a search or a category
 * filter narrows the menu to nothing. No frame draws this state — every
 * mock is populated — but a customer typing a keyword that matches nothing
 * needs to see that plainly rather than a blank column.
 */
export function MenuEmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center gap-[4px] px-[20px] py-[48px] text-center">
      <p className="text-[15px] font-bold text-foreground">
        No dishes match{hasFilter ? " your search" : ""}.
      </p>
      {hasFilter ? (
        <p className="text-[13px] text-muted-foreground">
          Try a different keyword or category.
        </p>
      ) : null}
    </div>
  );
}
