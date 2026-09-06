import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mobile bottom tab bar (`132:256`): Menu, Cart, Orders, Me.
 *
 * Shared from the start rather than built local to the menu screen and
 * extracted later, unlike the desktop nav bar in `components/nav/site-nav-
 * bar.tsx`. The reason the two ticket differently: this bar's second
 * consumer, `/cart`, is already named in ticket 04
 * (`.scratch/ordering-flow/issues/04-cart.md`, "reached from the bottom tab
 * bar"), so the shape of what varies — which tab is current, the cart count
 * — is known now rather than guessed.
 *
 * The four glyphs (☰ ▤ ◉ ☺) match the frame and the codebase's existing
 * convention of drawing simple icons as characters (`⌕`, `‹`, `▾` elsewhere)
 * rather than pulling in an icon library for four marks.
 */

export type BottomTab = "menu" | "cart" | "orders" | "account";

const TABS: { id: BottomTab; href: string; icon: string; label: string }[] = [
  { id: "menu", href: "/menu", icon: "☰", label: "Menu" },
  { id: "cart", href: "/cart", icon: "▤", label: "Cart" },
  { id: "orders", href: "/orders", icon: "◉", label: "Orders" },
  { id: "account", href: "/profile", icon: "☺", label: "Me" },
];

export function BottomTabBar({
  current,
  cartCount,
}: {
  current: BottomTab;
  /** Real read, not a placeholder — see `lib/cart/cart-count.ts`. */
  cartCount: number;
}) {
  return (
    <nav
      aria-label="Primary"
      className="flex h-[79px] items-center justify-around border-t border-field-border bg-card md:hidden"
    >
      {TABS.map(({ id, href, icon, label }) => {
        const isCurrent = id === current;
        // "Cart (3)" in the frame is the label plus a live count. At zero
        // there is nothing to count, so the parenthetical is dropped rather
        // than shown as "Cart (0)" — a number invented to match the frame
        // literally would say something false about an empty cart.
        const displayLabel =
          id === "cart" && cartCount > 0 ? `${label} (${cartCount})` : label;

        return (
          <Link
            key={id}
            href={href}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-[4px] px-[8px] py-[4px]",
              isCurrent ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className="text-[19px] leading-none" aria-hidden="true">
              {icon}
            </span>
            <span className="text-[11px] font-medium">{displayLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
