import { CartContents } from "@/components/cart/cart-contents";
import { cartItemCount, type CartLine } from "@/lib/menu/cart-totals";

/**
 * The desktop cart (`133:945`): a 328px column pinned to the right of
 * `/menu`, so the customer never leaves the browse screen to see it. The
 * one structural difference in the whole ordering flow — mobile's cart is
 * its own route instead, built by `app/(shop)/cart/page.tsx`.
 */
export function DesktopCartRail({ lines }: { lines: CartLine[] }) {
  const count = cartItemCount(lines);

  return (
    <aside className="hidden w-[328px] shrink-0 flex-col gap-[14px] border-l border-field-border bg-secondary/20 px-[22px] py-[24px] md:flex">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[22px] text-foreground">YOUR CART</h2>
        <span className="text-[12px] text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>

      <CartContents lines={lines} ctaLabel="Checkout" showEstimate />
    </aside>
  );
}
