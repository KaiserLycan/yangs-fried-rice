import Link from "next/link";
import { AvatarButton } from "@/components/profile/avatar-button";
import { shortAddressLabel } from "@/lib/profile/address-label";
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
  { id: "track-order", href: "/orders", label: "Track order" },
  { id: "orders", href: "/orders", label: "My orders" },
  { id: "account", href: "/profile", label: "Account" },
];

export function SiteNavBar({
  profile,
  currentSection,
  search,
}: {
  profile: CustomerProfile;
  currentSection: NavSection;
  search?: React.ReactNode;
}) {
  const deliverTo = shortAddressLabel(profile.deliverToAddress);
  const initials = initialsFrom(profile.name);

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
        <div className="flex items-center gap-[14px]">
          {/* Hidden rather than replaced when there is no saved address.
              Managing addresses belongs to a later ticket, and an empty state
              here would be a control the design does not draw. */}
          {deliverTo ? (
            <div className="flex flex-col items-end gap-px">
              <span className="text-[11px] text-background/[0.72]">
                Deliver to
              </span>
              <span className="text-[11px] font-bold text-white">
                {deliverTo} &#9662;
              </span>
            </div>
          ) : null}
          <AvatarButton
            initials={initials}
            className="size-[32px] bg-accent text-[12px] font-bold text-white"
          />
        </div>
      </div>
    </nav>
  );
}
