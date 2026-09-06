import { formatPeso, type ProductListing } from "@/lib/menu/product-listing";
import { ProductPhotoPlaceholder } from "@/components/menu/product-photo-placeholder";

/**
 * Mobile's full-width row (`132:122` and its siblings) — the same card
 * content as `ProductCard`, laid out as a photo-left / text-right row
 * instead of a stacked column. See that component's comment for why no
 * star rating renders.
 */
export function ProductRow({ product }: { product: ProductListing }) {
  return (
    <div className="flex gap-[13px] border-b border-field-border px-[20px] py-[12px] last:border-b-0">
      <ProductPhotoPlaceholder className="size-[74px] shrink-0 rounded-md" />

      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <h3 className="text-[15px] font-bold text-foreground">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-[13px] text-muted-foreground">
          {product.description}
        </p>
        <span className="font-display text-[19px] text-foreground">
          {formatPeso(product.price)}
        </span>
      </div>
    </div>
  );
}
