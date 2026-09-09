import Link from "next/link";
import { redirect } from "next/navigation";
import { CartContents } from "@/components/cart/cart-contents";
import { ToastProvider } from "@/components/ui/toast";
import { readCart } from "@/lib/cart/read-cart";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Mobile's cart page (`132:316`, empty state `132:393`) — the one structural
 * difference in the ordering flow, since desktop shows the same contents as
 * a rail inside `/menu` instead (`components/cart/desktop-cart-rail.tsx`).
 * Both places render `CartContents`; only the surrounding chrome differs.
 *
 * No bottom tab bar here, matching the precedent ticket 06 already set for
 * the tracking screen: once a customer is inside a specific flow screen
 * rather than browsing, the tab bar doesn't follow them. The frame agrees —
 * its own height accounts for exactly the header, the list and the totals,
 * with no room left for one.
 */
export default async function CartPage() {
  const [profile, lines] = await Promise.all([readCustomerProfile(), readCart()]);

  // Middleware already turns signed-out visitors away from /cart, so
  // reaching this is not expected. Guarded anyway, the same reasoning
  // ProfilePage gives: middleware is defence in depth, not the only check.
  if (!profile) redirect("/login?next=/cart");

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex h-[69px] shrink-0 items-center gap-[12px] px-[20px]">
          <Link
            href="/menu"
            aria-label="Back to menu"
            className="flex size-[36px] items-center justify-center text-[19px] text-foreground"
          >
            ←
          </Link>
          <h1 className="font-display text-[24px] text-foreground">YOUR CART</h1>
        </div>

        <div className="flex flex-1 flex-col px-[20px] pb-[24px]">
          <CartContents
            lines={lines}
            ctaLabel="Continue to checkout"
            showEstimate={false}
          />
        </div>
      </div>
    </ToastProvider>
  );
}
