import { formatPeso, type ProductListing } from "@/lib/menu/product-listing";
import { ProductPhotoPlaceholder } from "@/components/menu/product-photo-placeholder";

/**
 * Mobile's full-width row (`132:122` and its siblings) — the same card
 * content as `ProductCard`, laid out as a photo-left / text-right row
 * instead of a stacked column. See that component's comment for why no
 * star rating renders.
 *
 * The whole row is the click target here, unlike the desktop card — the
 * frame draws this row itself as a `button`, and unlike the desktop card it
 * has no separate Add control to be nested inside it.
 */
export function ProductRow({
  product,
  onSelect,
}: {
  product: ProductListing;
  onSelect: (product: ProductListing) => void;
}) {
  const content = (
    <>
      <ProductPhotoPlaceholder className="size-[74px] shrink-0 rounded-md" />

      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <h3 className="text-[15px] font-bold text-foreground">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-[13px] text-muted-foreground">
          {product.description}
        </p>
        <div className="flex items-center gap-[8px]">
          <span className="font-display text-[19px] text-foreground">
            {formatPeso(product.price)}
          </span>
          {!product.isAvailable && (
            <span className="rounded-md bg-secondary/50 px-[6px] py-[3px] text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (!product.isAvailable) {
    return (
      <div className="flex gap-[13px] border-b border-field-border px-[20px] py-[12px] text-left last:border-b-0 opacity-50">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex gap-[13px] border-b border-field-border px-[20px] py-[12px] text-left last:border-b-0 transition-opacity hover:opacity-90"
    >
      {content}
    </button>
  );
}
