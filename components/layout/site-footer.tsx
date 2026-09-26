import Link from "next/link";
import {
  SITE_BRANCH,
  SITE_NAME,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  copyrightYears,
} from "@/lib/site/site-info";

/**
 * The site footer (issue #106: "no site footer exists anywhere").
 *
 * Customer-facing only. It is mounted by the `(shop)` and `(account)`
 * layouts rather than the root layout, because the root also wraps
 * `/manage`, `/deliver` and `/employee` — a kitchen display or a rider's
 * phone has no use for a storefront footer, and the KDS in particular is a
 * full-screen surface that nobody scrolls. The auth screens are left out for
 * the same kind of reason: they are a two-column full-bleed composition with
 * artwork, and a cream band under it belongs to neither column.
 *
 * Every link here points at a route that exists. Contact details and social
 * accounts are read from `lib/site/site-info.ts`, which holds `null` for all
 * of them today — the repository has no real ones — so those blocks do not
 * render at all rather than showing an address nobody reads.
 *
 * Server component: `copyrightYears()` reads the clock, and doing that in a
 * client component is how a footer ends up with one year on the server and
 * another in the browser.
 */
export function SiteFooter() {
  const hasContact = Boolean(SUPPORT_EMAIL || SUPPORT_PHONE);

  return (
    <footer
      // The bottom padding clears `BottomTabBar`, which is fixed to the
      // viewport on mobile and would otherwise sit on top of the last row
      // here. Same `--tab-bar-height` every other screen reserves.
      className="border-t border-rule bg-card px-[22px] pb-[calc(var(--tab-bar-height)_+_24px)] pt-[28px] md:px-[32px] md:pb-[28px]"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-[24px] md:flex-row md:justify-between md:gap-[48px]">
        <div className="flex max-w-[320px] flex-col gap-[8px]">
          <span className="font-display text-[19px] tracking-[0.57px] text-primary">
            YANG&apos;S <span className="text-foreground">FRIED RICE</span>
          </span>
          <p className="text-[13px] leading-[19px] text-muted-foreground">
            Fried rice, silog plates and sides, cooked to order for delivery
            across Metro Manila or collection in store.
          </p>
          <p className="text-[12px] text-muted-foreground">{SITE_BRANCH}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-[8px]">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.1px] text-muted-foreground">
            Explore
          </h2>
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[13px] text-foreground hover:text-primary hover:underline"
            >
              {label}
            </Link>
          ))}
        </nav>

        {hasContact || SOCIAL_LINKS.length > 0 ? (
          <div className="flex flex-col gap-[8px]">
            <h2 className="text-[11px] font-bold uppercase tracking-[1.1px] text-muted-foreground">
              Get in touch
            </h2>
            {SUPPORT_EMAIL ? (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[13px] text-foreground hover:text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            ) : null}
            {SUPPORT_PHONE ? (
              <a
                href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                className="text-[13px] text-foreground hover:text-primary hover:underline"
              >
                {SUPPORT_PHONE}
              </a>
            ) : null}
            {SOCIAL_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                // These leave the site, so they are plain anchors rather than
                // `Link`, and they carry the usual new-tab protections.
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-foreground hover:text-primary hover:underline"
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-[24px] flex max-w-[1100px] flex-col gap-[6px] border-t border-rule pt-[16px] md:flex-row md:items-center md:justify-between">
        <p className="text-[12px] text-muted-foreground">
          © {copyrightYears()} {SITE_NAME}. All rights reserved.
        </p>
        <p className="text-[12px] text-muted-foreground">
          Prices in Philippine peso. Delivery within Metro Manila only.
        </p>
      </div>
    </footer>
  );
}

/** Routes only — every one of these resolves today. */
const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "My orders" },
  { href: "/profile", label: "Account" },
  { href: "/terms", label: "Terms & Policy" },
];
