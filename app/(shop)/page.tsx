import Image from "next/image";
import Link from "next/link";
import { Clock, CreditCard, MapPin, ShoppingBag, Store, UtensilsCrossed } from "lucide-react";
import { PromoCarousel, type PromoSlide } from "@/components/landing/promo-carousel";
import { MobileMenuHeader } from "@/components/menu/mobile-menu-header";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { getActivePromotions } from "@/lib/actions/promotions";
import { readCart } from "@/lib/cart/read-cart";
import { cartItemCount } from "@/lib/menu/cart-totals";
import { readBestSellers, readCategoryTiles, type LandingProduct } from "@/lib/menu/landing";
import { formatPeso } from "@/lib/menu/product-listing";
import { readCustomerProfile } from "@/lib/profile/customer-profile";
import { DIRECTIONS_HREF, PICKUP_COUNTER, SELLER_ADDRESS, SITE_BRANCH, SITE_DESCRIPTION } from "@/lib/site/site-info";
import { formatStoreHours, type StoreStatus } from "@/lib/store/store-status";
import { readStoreStatus } from "@/lib/store/read-store-status";

/**
 * The storefront's front door, laid out the way Filipino fast-food chains do
 * theirs (Jollibee, McDonald's PH): a banner carousel of what's on promo, a
 * row of category tiles, the best sellers with an order button each, how
 * pickup works, and where the store is. Every section links into /menu, which
 * stays the one place ordering happens.
 */
export default async function HomePage() {
  const profilePromise = readCustomerProfile();
  const [storeStatus, promotions, bestSellers, categories, cart] = await Promise.all([
    readStoreStatus(),
    getActivePromotions(),
    readBestSellers(4),
    readCategoryTiles(),
    readCart().catch(() => null),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const slides: PromoSlide[] = [
    ...promotions.map((promo) => ({
      id: promo.id,
      eyebrow: "Limited time",
      title: promo.title,
      body: promo.description,
      imageUrl: promo.image_url,
      href: promo.product_id
        ? `/menu?item=${promo.product_id}`
        : promo.category_id && categoryName.has(promo.category_id)
          ? `/menu?category=${encodeURIComponent(categoryName.get(promo.category_id)!)}`
          : "/menu",
      cta: "Order now",
    })),
    // Always at least one banner, even with no promo running.
    {
      id: "house",
      eyebrow: "Wok-fired to order",
      title: "Hot at the counter.",
      body: SITE_DESCRIPTION,
      // The house banner shows the house dish: a fried rice photo first.
      imageUrl:
        categories.find((c) => /fried rice/i.test(c.name) && c.imageUrl)?.imageUrl ??
        bestSellers.find((p) => p.imageUrl)?.imageUrl ??
        null,
      href: "/menu",
      cta: "Start your order",
    },
  ];

  return (
    <div className="flex flex-col bg-background pb-[var(--tab-bar-height)] md:pb-0">
      <SiteNavBar profilePromise={profilePromise} currentSection="menu" />
      <MobileMenuHeader profilePromise={profilePromise} />

      <PromoCarousel slides={slides} />
      <StoreStrip status={storeStatus} />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-4 py-12 md:gap-20 md:px-10 md:py-16">
        {categories.length > 0 && (
          <section aria-labelledby="menu-heading" className="flex flex-col gap-6">
            <SectionHeading id="menu-heading" title="Explore our menu" href="/menu" linkLabel="See full menu" />
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/menu?category=${encodeURIComponent(category.name)}`}
                    className="group flex flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <span className="relative size-[84px] overflow-hidden rounded-full border-4 border-card bg-secondary shadow-md transition-transform group-hover:scale-105 md:size-[96px]">
                      {category.imageUrl ? (
                        <Image src={category.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                      ) : (
                        <UtensilsCrossed className="absolute inset-0 m-auto size-8 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <span className="text-sm font-bold leading-tight text-foreground">{category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {bestSellers.length > 0 && (
          <section aria-labelledby="best-heading" className="flex flex-col gap-6">
            <SectionHeading id="best-heading" title="Best sellers" href="/menu" linkLabel="Order now" />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {bestSellers.map((product, i) => (
                <li key={product.id}>
                  <BestSellerCard product={product} rank={i + 1} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <HowItWorks />

      <section aria-labelledby="visit-heading" className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-12 md:grid-cols-2 md:items-center md:gap-10 md:px-10 md:py-16">
        <div className="flex flex-col gap-4">
          <h2 id="visit-heading" className="font-display text-3xl uppercase text-foreground md:text-5xl">
            Visit <span className="text-primary">Yang&apos;s</span>
          </h2>
          <p className="text-base text-muted-strong">
            Order ahead, skip the line, and collect at {PICKUP_COUNTER}. Pickup only — we don&apos;t deliver, but
            you&apos;re welcome to send a courier.
          </p>
          <dl className="flex flex-col gap-3 text-base">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <dt className="sr-only">Address</dt>
                <dd className="font-bold text-foreground">{SELLER_ADDRESS}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <dt className="sr-only">Hours</dt>
                <dd className="text-foreground">Open daily, {formatStoreHours(storeStatus)}</dd>
              </div>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/menu"
              className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-7 text-base font-bold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Order for pickup
            </Link>
            <a
              href={DIRECTIONS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center rounded-full border-2 border-primary px-7 text-base font-bold text-primary hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Get directions
            </a>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-primary shadow-lg">
          <Image src="/images/login-hero.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-90" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary to-transparent p-6">
            <p className="font-display text-3xl uppercase text-on-brand">{SITE_BRANCH}</p>
          </div>
        </div>
      </section>

      <div className="md:hidden">
        <BottomTabBar current="menu" cartCount={cart ? cartItemCount(cart.lines) : 0} />
      </div>
    </div>
  );
}

function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 id={id} className="font-display text-3xl uppercase text-foreground md:text-5xl">
        {title}
      </h2>
      <Link href={href} className="shrink-0 pb-1 text-sm font-bold text-primary hover:underline md:text-base">
        {linkLabel} &rarr;
      </Link>
    </div>
  );
}

function StoreStrip({ status }: { status: StoreStatus }) {
  const taking = status.isOpen && !status.isPaused && !status.isBusy;
  const label = !status.isOpen
    ? "Closed right now"
    : status.isPaused || status.isBusy
      ? "Very busy — orders paused"
      : "Open now";
  return (
    <div className="border-b border-rule bg-card">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-strong">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-bold uppercase tracking-[1px] text-white ${taking ? "bg-success" : "bg-destructive"}`}
          >
            <span className="size-2 rounded-full bg-white" aria-hidden />
            {label}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Store className="size-4 text-primary" aria-hidden /> Pickup at {SITE_BRANCH}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-primary" aria-hidden /> {formatStoreHours(status)}
          </span>
        </div>
        <Link
          href="/menu"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-accent px-6 text-base font-bold text-white hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {taking ? "Order now" : "Browse the menu"}
        </Link>
      </div>
    </div>
  );
}

function BestSellerCard({ product, rank }: { product: LandingProduct; rank: number }) {
  return (
    <Link
      href={`/menu?item=${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-rule bg-card shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="relative aspect-square bg-secondary">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <UtensilsCrossed className="absolute inset-0 m-auto size-10 text-muted-foreground" aria-hidden />
        )}
        <span className="absolute left-0 top-3 rounded-r-full bg-primary py-1 pl-3 pr-4 text-sm font-bold uppercase tracking-[0.8px] text-white shadow">
          #{rank} Best seller
        </span>
        {!product.isAvailable && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1 text-center text-sm font-bold text-white">
            Sold out today
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        {product.categoryName && (
          <span className="text-sm uppercase tracking-[1px] text-muted-foreground">{product.categoryName}</span>
        )}
        <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground md:text-lg">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-display text-2xl text-primary">{formatPeso(product.price)}</span>
          <span className="inline-flex min-h-[40px] items-center rounded-full bg-accent px-4 text-sm font-bold text-white group-hover:bg-accent/90">
            Order
          </span>
        </div>
      </div>
    </Link>
  );
}

const STEPS = [
  { icon: UtensilsCrossed, title: "Pick your food", body: "Browse the menu and add your favourites — fried rice, dim sum, noodles and more." },
  { icon: CreditCard, title: "Pay your way", body: "GCash or Maya online, or pay at the counter when you collect." },
  { icon: ShoppingBag, title: "Grab it hot", body: `We'll let you know the moment it's ready. Show your order number at ${PICKUP_COUNTER}.` },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-primary">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 md:px-10 md:py-16">
        <h2 id="how-heading" className="font-display text-3xl uppercase text-on-brand md:text-5xl">
          Order ahead in <span className="text-on-brand-accent">3 easy steps</span>
        </h2>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4 rounded-lg bg-white/10 p-5 md:flex-col">
              <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-on-brand-accent text-foreground">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-2xl uppercase text-on-brand">
                  {i + 1}. {title}
                </h3>
                <p className="text-base text-on-brand-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
