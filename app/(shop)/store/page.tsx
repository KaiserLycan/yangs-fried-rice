import Image from "next/image";
import Link from "next/link";
import { Clock, Info, MapPin, Navigation, ShoppingBag, Store, type LucideIcon } from "lucide-react";
import { MobileMenuHeader } from "@/components/menu/mobile-menu-header";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { readCustomerProfile } from "@/lib/profile/customer-profile";
import {
  DIRECTIONS_HREF,
  PICKUP_COUNTER,
  SELLER_ADDRESS,
  SELLER_NAME,
  SITE_BRANCH,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from "@/lib/site/site-info";
import { formatTime } from "@/lib/store-hours";
import { formatStoreHours } from "@/lib/store/store-status";
import { readStoreStatus } from "@/lib/store/read-store-status";

export const metadata = { title: "Find a store · Yang's Fried Rice" };

/**
 * "Find a store" (panel feedback F4). One branch today, so this is its
 * card: where it is, when it's open, where to collect, and how to get
 * there. It also carries the seller details the Internet Transactions Act
 * asks an online shop to show (limitations L13).
 */
export default async function StorePage() {
  const profilePromise = readCustomerProfile();
  const status = await readStoreStatus();
  const taking = status.isAccepting && !status.isPaused && !status.isBusy;

  return (
    <div className="flex flex-col bg-background pb-[var(--tab-bar-height)] md:pb-0">
      <SiteNavBar profilePromise={profilePromise} currentSection="menu" />
      <MobileMenuHeader profilePromise={profilePromise} />

      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-8 md:px-10 md:py-12">
        <h1 className="font-display text-3xl uppercase text-foreground md:text-5xl">Find a store</h1>

        <article className="grid overflow-hidden rounded-lg border border-rule bg-card shadow-sm md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-[220px] bg-primary">
            <Image src="/images/login-hero.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-90" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary to-transparent p-5">
              <p className="font-display text-3xl uppercase text-on-brand">{SITE_BRANCH}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-5 md:p-7">
            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-[1px] text-white ${taking ? "bg-success" : "bg-destructive"}`}
            >
              <span className="size-2 rounded-full bg-white" aria-hidden />
              {!status.isOpen ? "Closed now" : taking ? "Open now" : status.isAccepting ? "Very busy" : "Last orders done"}
            </span>

            <dl className="flex flex-col gap-4 text-base">
              <Detail icon={MapPin} label="Address">
                <span className="font-bold text-foreground">{SELLER_ADDRESS}</span>
              </Detail>
              <Detail icon={Clock} label="Hours">
                Open daily, {formatStoreHours(status)}
                {status.lastOrderMinutes > 0 && (
                  <span className="block text-sm text-muted-foreground">
                    Last orders at {formatTime(status.lastOrderTime)} so the kitchen can finish before closing.
                  </span>
                )}
              </Detail>
              <Detail icon={ShoppingBag} label="Pickup">
                Collect at {PICKUP_COUNTER}. Show your order number — we&apos;ll have it bagged.
              </Detail>
              <Detail icon={Info} label="Delivery">
                Pickup only — we don&apos;t deliver. You&apos;re welcome to book a courier (Lalamove, Grab) and choose
                &ldquo;3rd party courier&rdquo; at checkout.
              </Detail>
              <Detail icon={Store} label="Seller">
                {SELLER_NAME}
                {SUPPORT_PHONE && (
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="block text-primary hover:underline">
                    {SUPPORT_PHONE}
                  </a>
                )}
                {SUPPORT_EMAIL && (
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="block text-primary hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                )}
                {!SUPPORT_PHONE && !SUPPORT_EMAIL && (
                  <span className="block text-sm text-muted-foreground">
                    Questions about an order? Use &ldquo;Report a problem&rdquo; on the order page.
                  </span>
                )}
              </Detail>
            </dl>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 text-base font-bold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Order for pickup
              </Link>
              <a
                href={DIRECTIONS_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-2 border-primary px-6 text-base font-bold text-primary hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Navigation className="size-4" aria-hidden />
                Get directions
              </a>
            </div>
          </div>
        </article>
      </div>

      <div className="md:hidden">
        <BottomTabBar current="menu" cartCount={0} />
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div>
        <dt className="text-sm font-bold uppercase tracking-[1px] text-muted-foreground">{label}</dt>
        <dd className="text-foreground">{children}</dd>
      </div>
    </div>
  );
}
