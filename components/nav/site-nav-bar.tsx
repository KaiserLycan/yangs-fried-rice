// trigger rebuild
import { Suspense, use } from "react";
import Link from "next/link";
import { NavAddressDropdown } from "@/components/nav/nav-address-dropdown";
import { Avatar } from "@/components/ui/avatar";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { initialsFrom } from "@/lib/profile/identity";
import { cn } from "@/lib/utils";

/**
 * The red desktop nav bar, shared by every signed-in page that carries it.
 *
 * Extracted from `ProfileHeader`, which built it local to the profile screen
 * on purpose until a second real consumer existed to compare against — see
 * that file's own comment. The menu screen (`.scratch/ordering-flow/issues/
 * 02-menu-browse.md`) is that consumer, and confirmed with Yuan, the one
 * thing that varies between pages is whether a search field is present.
 * Everything else — wordmark, the four section links, the delivery address,
 * the avatar — is identical everywhere this renders.
 *
 * Desktop only. The mobile header is not part of this component and is not
 * going to become one: profile's mobile chrome (a back control and a page
 * title) and menu's (an address disclosure, a full-width search field, and a
 * bottom tab bar) share nothing but a background colour, so folding them
 * together would produce one component wearing two disguises rather than a
 * real shared piece. Each page keeps its own mobile header, same as before.
 *
 * `search` is a slot, not a built-in field: this component only reserves the
 * space and the gap the frame draws, and does not know what a search box
 * looks like or does. Building the actual control belongs to whichever
 * ticket introduces its first real consumer.
 *
 * `profile` accepts `null` because `/menu` — this component's second real
 * consumer — is public (see `middleware.ts`'s matcher, which does not
 * include it): a guest can browse without signing in. No frame draws a
 * signed-out nav bar, so the treatment below is a derived decision, not a
 * traced one — see `.scratch/ordering-flow/issues/02-menu-browse.md`.
 * ticket introduces its first real consumer. Because it renders `AvatarButton`,
 * this component must be mounted under a `ToastProvider`.
 */

export type NavSection = "menu" | "track-order" | "orders" | "account";

/**
 * `id` is what decides the current link, never the label — renaming or
 * reordering these can't silently move the underline to a different link.
 *
 * "Track order" and "My orders" both point at `/orders` today because no
 * dedicated tracking route exists yet (see `.scratch/ordering-flow/issues/
 * 06-track-order.md`); they still carry distinct ids so each can be marked
 * current independently once that route exists.
 */
const NAV_LINKS: { id: NavSection; href: string; label: string }[] = [
  { id: "menu", href: "/menu", label: "Menu" },
  { id: "orders", href: "/orders", label: "My orders" },
  { id: "account", href: "/profile", label: "Account" },
];

function ResolvedProfileActions({
  profile: initialProfile,
  profilePromise
}: {
  profile?: CustomerProfile | null;
  profilePromise?: Promise<CustomerProfile | null>;
}) {
  // If we have a promise, unwrap it. Otherwise use the profile directly.
  const profile = profilePromise ? use(profilePromise) : (initialProfile ?? null);
  const initials = profile ? initialsFrom(profile.name) : "";

  return (
    <div className="flex items-center gap-[14px]">
      {profile && profile.addresses.length > 0 ? (
        <NavAddressDropdown
          addresses={profile.addresses}
          activeAddressId={profile.activeAddressId}
        />
      ) : null}
      {profile ? (
        <Link
          href="/profile"
          className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label="Go to your account"
        >
          <Avatar
            initials={initials}
            imageUrl={profile.profileImageUrl}
            className="size-[32px] bg-accent text-[12px] font-bold text-white"
          />
        </Link>
      ) : (
        <Link
          href="/login"
          className="text-[13px] font-bold text-white hover:underline"
        >
          Log in
        </Link>
      )}
    </div>
  );
}

export function SiteNavBar({
  profile,
  profilePromise,
  currentSection,
  search,
}: {
  profile?: CustomerProfile | null;
  profilePromise?: Promise<CustomerProfile | null>;
  currentSection: NavSection;
  search?: React.ReactNode;
}) {
  return (
    <nav className="hidden h-[58px] items-center gap-[26px] bg-primary px-[22px] md:flex">
      <Link
        href="/menu"
        className="font-display text-[19px] tracking-[0.57px] text-rule"
      >
        YANG&apos;S <span className="text-white">FRIED RICE</span>
      </Link>

      <ul className="flex items-start gap-[20px]">
        {NAV_LINKS.map(({ id, href, label }) => {
          const isCurrent = id === currentSection;
          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "text-[13.5px]",
                  isCurrent
                    ? "border-b-2 border-white pb-[3px] text-white"
                    : "text-background/[0.72] hover:text-white",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* The 16px gap here is only visible once `search` is passed — a lone
          child in a flex row has no sibling for its gap to apply against, so
          the profile screen (no search) renders byte-identical to before this
          nesting existed. The 14px between the address and the avatar is
          unchanged from the pre-extraction markup. */}
      <div className="ml-auto flex items-center gap-[16px]">
        {search}

        {profilePromise ? (
          <Suspense fallback={<div className="size-[32px] animate-pulse rounded-full bg-white/20" />}>
            <ResolvedProfileActions profilePromise={profilePromise} />
          </Suspense>
        ) : (
          <ResolvedProfileActions profile={profile} />
        )}
      </div>
    </nav>
  );
}
