import { CartContents } from "@/components/cart/cart-contents";
import {
  cartItemCount,
  type CartLine,
  type Fulfilment,
} from "@/lib/menu/cart-totals";

/**
 * The desktop cart (`133:945`): a 328px column pinned to the right of
 * `/menu`, so the customer never leaves the browse screen to see it. The
 * one structural difference in the whole ordering flow — mobile's cart is
 * its own route instead, built by `app/(shop)/cart/page.tsx`.
 */
export function DesktopCartRail({
  lines,
  initialFulfilment,
  arrivalEstimate = null,
}: {
  lines: CartLine[];
  /** Carried back from checkout — see `CartContents`. */
  initialFulfilment?: Fulfilment;
  /**
   * Quoted from the live kitchen queue. Unlike checkout there is no address
   * geocoded on this screen, so the engine's default transit time stands in
   * for the distance — the queue is the half that actually moves.
   */
  arrivalEstimate?: string | null;
}) {
  const count = cartItemCount(lines);

  // The aside stretches the full height of the page so its background and
  // border never end mid-scroll. The inner panel is the sticky part, so
  // Checkout stays in view on a long menu (P40). Its height leaves out the
  // 58px SiteNavBar so the button is on screen before any scrolling too; once
  // the nav has scrolled away the aside's own background fills the 58px below.
  return (
    <aside className="hidden w-[328px] shrink-0 self-stretch border-l border-field-border bg-secondary/20 md:block">
      <div className="sticky top-0 flex h-[calc(100vh-58px)] flex-col gap-[14px] px-[22px] py-[24px]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-foreground">YOUR CART</h2>
          <span className="text-sm text-muted-foreground">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>

        <CartContents
          lines={lines}
          ctaLabel="Checkout"
          arrivalEstimate={arrivalEstimate}
          initialFulfilment={initialFulfilment}
        />
      </div>
    </aside>
  );
}
