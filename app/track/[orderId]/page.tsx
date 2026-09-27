import Link from "next/link";
import { GuestTrackingScreen } from "@/components/orders/guest-tracking-screen";
import { readPublicOrderTracking } from "@/lib/actions/public-tracking";

export const metadata = { title: "Track your order · Yang's Fried Rice", robots: { index: false } };

/**
 * /track/<order_id>?t=<token> — an order's status for anyone holding the
 * link, no sign-in (FINALE "More things"). The customer gets the link on
 * their order page and can open it on any phone, or send it to whoever is
 * collecting.
 */
export default async function TrackPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { t?: string | string[] };
}) {
  const token = Array.isArray(searchParams.t) ? searchParams.t[0] : searchParams.t;
  const order = token ? await readPublicOrderTracking(params.orderId, token) : null;

  if (!order || !token) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[520px] flex-col items-start justify-center gap-3 px-4">
        <h1 className="font-display text-3xl uppercase text-foreground">Link not found</h1>
        <p className="text-base text-muted-strong">
          This tracking link is incomplete or no longer matches an order. Open the link from your order page again, or
          sign in to see your orders.
        </p>
        <Link
          href="/orders"
          className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-6 text-base font-bold text-white hover:bg-primary/90"
        >
          My orders
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-primary px-4 py-3">
        <Link href="/" className="font-display text-lg tracking-[0.57px]">
          <span className="text-on-brand-accent">YANG&apos;S</span> <span className="text-background">FRIED RICE</span>
        </Link>
      </div>
      <GuestTrackingScreen initial={order} token={token} />
    </main>
  );
}
