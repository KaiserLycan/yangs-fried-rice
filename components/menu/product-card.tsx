import { formatPeso, type ProductListing } from "@/lib/menu/product-listing";
import { ProductPhotoPlaceholder } from "@/components/menu/product-photo-placeholder";

/**
 * The desktop grid card (`133:791` and its siblings): photo, name,
 * description, price, and an Add button.
 *
 * The frame also draws a star rating next to the name ("★ 4.9"). There is
 * nowhere for that number to come from — `review` rows attach to an
 * *order*, not a product (confirmed against the live generated types, which
 * is also what `CLAUDE.md` says the correct model is), so no per-dish
 * rating can exist without a new table. Showing one here would be
 * fabricated, so it's left out rather than invented. See this ticket's
 * "Derived during implementation" note.
 *
 * Only "Add" is a click target here, not the whole card — the frame draws
 * it that way (the card itself is a plain `div`, only the Add control is
 * typed `button`), and it's also what keeps this a single `<button>` rather
 * than one nested inside a card that might itself become clickable later.
 */
export function ProductCard({
  product,
  onSelect,
}: {
  product: ProductListing;
  onSelect: (product: ProductListing) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-field-border bg-card">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-[138px] w-full object-cover"
        />
      ) : (
        <ProductPhotoPlaceholder className="h-[138px] w-full" />
      )}

      <div className="flex flex-1 flex-col gap-[10px] p-[14px]">
        <h3 className="text-[15px] font-bold text-foreground">
          {product.name}
        </h3>

        <p className="line-clamp-2 flex-1 text-[13px] text-muted-foreground">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-display text-[22px] text-foreground">
            {formatPeso(product.price)}
          </span>
          <div className="flex items-center gap-[10px]">
            {!product.isAvailable ? (
              <span className="rounded-md bg-secondary/50 px-[8px] py-[4px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Unavailable
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSelect(product)}
                className="rounded-md bg-accent px-[16px] py-[9px] text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
