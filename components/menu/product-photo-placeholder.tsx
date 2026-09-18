import { cn } from "@/lib/utils";

/**
 * Stands in for the dish photo every card frame draws. There is no photo
 * column on `product` and no upload path anywhere yet — the same gap
 * `profile-page-handoff.md` §3 records for the customer's own avatar — so
 * this renders a deliberate empty state rather than a stock image or a
 * guessed one, the same choice `CardValue`'s `emptyState` makes for a field
 * with nothing in it.
 */
export function ProductPhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-secondary/40 text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground",
        className,
      )}
    >
      No photo yet
    </div>
  );
}
