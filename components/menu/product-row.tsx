import { formatPeso, type ProductListing } from "@/lib/menu/product-listing";
import { ProductPhotoPlaceholder } from "@/components/menu/product-photo-placeholder";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Mobile's full-width row (`132:122` and its siblings) — the same card
 * content as `ProductCard`, laid out as a photo-left / text-right row
 * instead of a stacked column. See that component's comment for why no
 * star rating renders.
 *
 * The whole row is the click target here, unlike the desktop card — the
 * frame draws this row itself as a `button`, and unlike the desktop card it
 * has no separate Add control to be nested inside it. A guest who taps it
 * gets the dish's sheet, whose action reads "Sign in to order" (panel F3).
 *
 * An unavailable dish has its photo greyed out (F12), the same treatment as
 * the desktop card. It used to fade the whole row to 50%, which also took
 * the name and price below readable contrast.
 */
export function ProductRow({
  product,
  onSelect,
}: {
  product: ProductListing;
  onSelect: (product: ProductListing) => void;
}) {
  const unavailable = !product.isAvailable;

  return (
    <Button variant="unstyled"
      type="button"
      onClick={() => onSelect(product)}
      className="flex gap-[13px] border-b border-field-border px-[20px] py-[12px] text-left transition-opacity last:border-b-0 hover:opacity-90"
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className={cn("size-[74px] shrink-0 rounded-md object-cover", unavailable && "grayscale opacity-60")}
        />
      ) : (
        <ProductPhotoPlaceholder
          className={cn("size-[74px] shrink-0 rounded-md", unavailable && "grayscale opacity-60")}
        />
      )}

      <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <span className="text-base font-bold text-foreground">{product.name}</span>
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </span>
        <span className="flex items-center gap-[8px]">
          <span className="font-display text-lg text-foreground">
            {formatPeso(product.price)}
          </span>
          {unavailable && (
            <span className="rounded-md bg-secondary/50 px-[6px] py-[3px] text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Unavailable
            </span>
          )}
        </span>
      </span>
    </Button>
  );
}
