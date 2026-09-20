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


    </header>
  );
}
