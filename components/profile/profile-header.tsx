import Link from "next/link";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { AvatarButton } from "@/components/profile/avatar-button";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { initialsFrom } from "@/lib/profile/identity";

/**
 * The red bar across the top of the profile screen.
 *
 * Two compositions, not one layout reflowed — the same call the auth screens
 * made. Desktop renders the shared `SiteNavBar` with no search field; mobile
 * draws a page header local to this screen — a back control and the page
 * title. The two share only their background colour, which is why the
 * mobile half was never a candidate for extraction alongside the desktop
 * one: see `SiteNavBar`'s own comment for why.
 *
 * The desktop bar used to be built here directly. It came out once the menu
 * screen existed as a second real consumer to compare against — see
 * `.scratch/ordering-flow/issues/01-shared-nav-bar.md`. This screen is
 * pixel-unchanged by that move.
 *
 * The frames give the bar a 16px top corner radius. That is the artboard's
 * own rounding, not app chrome, so it is not reproduced.
 */

export function ProfileHeader({ profile }: { profile: CustomerProfile }) {
  const initials = initialsFrom(profile.name);

  return (
    <header className="bg-primary">
      <SiteNavBar profile={profile} currentSection="account" />

      {/* Mobile header, pinned to the 46px the frame draws. The frame puts a
          device status bar above this; that is mockup chrome and is not
          reproduced, which is why the bar sits flush against the top of the
          viewport. The padding is uneven because the frame's content sits
          toward the top of the bar rather than centred in it. */}
      <div className="flex h-[46px] items-center gap-[12px] px-[16px] pb-[14px] pt-[2px] md:hidden">
        {/* A fixed destination rather than history.back() — this page is
            reachable by direct link, where there is nothing to go back to. */}
        <Link
          href="/menu"
          aria-label="Back to menu"
          className="text-[19px] text-white"
        >
          &#8249;
        </Link>
        <span className="font-display text-[18px] tracking-[0.54px] text-white">
          MY PROFILE
        </span>
        <AvatarButton
          initials={initials}
          className="size-[30px] bg-accent text-[11.5px] font-bold text-white"
          wrapperClassName="ml-auto"
        />
      </div>
    </header>
  );
}
