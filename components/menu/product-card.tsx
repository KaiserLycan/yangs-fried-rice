import Link from "next/link";
import { signInToOrderHref } from "@/lib/menu/sign-in-href";
import { formatPeso, type ProductListing } from "@/lib/menu/product-listing";
import { ProductPhotoPlaceholder } from "@/components/menu/product-photo-placeholder";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BestSellerBadge, useIsBestSeller } from "@/components/menu/best-seller";

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
 * The photo and text are one button that opens the dish; the action in the
 * footer is its own control beside it, never nested inside. That is what
 * lets a guest's action be a link: a guest sees "Sign in to order" instead
 * of "Add" (panel F3), which goes to the login page and back to the menu,
 * rather than an Add that only fails with "You must be signed in".
 *
 * An unavailable dish keeps its card but its photo is greyed out (F12), so
 * it reads as off the menu for now at a glance, not only from the label.
 */
export function ProductCard({
  product,
  onSelect,
  isGuest = false,
  cartFull = false,
}: {
  product: ProductListing;
  onSelect: (product: ProductListing) => void;
  /** True once we know nobody is signed in. Unknown reads as signed in. */
  isGuest?: boolean;
  /**
   * The cart holds 30 items, the most one order can (issue #115). Add is
   * disabled; the card itself still opens the dish to read about it.
   */
  cartFull?: boolean;
}) {
  const unavailable = !product.isAvailable;
  const bestSeller = useIsBestSeller(product.id);

  return (
    <div className="group flex flex-col overflow-hidden rounded-md border border-field-border bg-card text-left transition-colors hover:border-accent">
      <Button variant="unstyled"
        type="button"
        onClick={() => onSelect(product)}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={cn("h-[138px] w-full object-cover", unavailable && "grayscale opacity-60")}
          />
        ) : (
          <ProductPhotoPlaceholder
            className={cn("h-[138px] w-full", unavailable && "grayscale opacity-60")}
          />
        )}

        <span className="flex flex-1 flex-col gap-[10px] px-[14px] pt-[14px]">
          {bestSeller && <BestSellerBadge />}
          <span className="text-base font-bold text-foreground">{product.name}</span>
          <span className="line-clamp-2 flex-1 text-sm text-muted-foreground">
            {product.description}
          </span>
        </span>
      </Button>

      <div className="flex items-center justify-between gap-[10px] p-[14px] pt-[10px]">
        <span className="font-display text-2xl text-foreground">
          {formatPeso(product.price)}
        </span>
        {unavailable ? (
          <span className="rounded-md bg-secondary/50 px-[8px] py-[4px] text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Unavailable
          </span>
        ) : isGuest ? (
          <Link
            href={signInToOrderHref(product.id)}
            className="flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-md bg-accent px-[14px] text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Sign in to order
          </Link>
        ) : (
          <Button variant="unstyled"
            type="button"
            onClick={() => onSelect(product)}
            disabled={cartFull}
            title={cartFull ? "Your cart is full (30 items)." : undefined}
            className="flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-md bg-accent px-[16px] text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground disabled:hover:opacity-100"
          >
            Add
            <span className="sr-only"> {product.name}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
