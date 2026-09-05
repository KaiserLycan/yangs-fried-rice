import Link from "next/link";
import { AvatarButton } from "@/components/profile/avatar-button";
import { shortAddressLabel } from "@/lib/profile/address-label";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { initialsFrom } from "@/lib/profile/identity";
import { cn } from "@/lib/utils";

/**
 * The red bar across the top of the profile screen.
 *
 * Two compositions, not one layout reflowed — the same call the auth screens
 * made. Desktop is a site-wide nav bar with the wordmark, section links and
 * the delivery address; mobile is a page header with a back control and the
 * page title. They share only their background colour.
 *
 * Built local to this page on purpose. The other pages that will share this
 * nav do not exist yet, so extracting it now would mean guessing which parts
 * vary. It comes out when there is a second real consumer to compare against,
 * the way the auth screens' brand panel is being handled.
 *
 * The frames give the bar a 16px top corner radius. That is the artboard's
 * own rounding, not app chrome, so it is not reproduced.
 */

const NAV_LINKS = [
  { href: "/menu", label: "Menu", isCurrent: false },
  // No dedicated tracking route exists yet — the Track screens are drawn but
  // unbuilt, so this lands on the order list alongside "My orders" until one
  // does. Deliberate, not a copy-paste slip.
  { href: "/orders", label: "Track order", isCurrent: false },
  { href: "/orders", label: "My orders", isCurrent: false },
  // This header only ever renders on the profile screen, so the current link
  // is fixed. Marked in the data rather than matched on the label, so
  // renaming or reordering cannot move the underline somewhere else.
  { href: "/profile", label: "Account", isCurrent: true },
];

export function ProfileHeader({ profile }: { profile: CustomerProfile }) {
  const deliverTo = shortAddressLabel(profile.deliverToAddress);
  const initials = initialsFrom(profile.name);

  return (
    <header className="bg-primary">
      {/* Desktop nav bar */}
      <nav className="hidden h-[58px] items-center gap-[26px] px-[22px] md:flex">
        <Link
          href="/menu"
          className="font-display text-[19px] tracking-[0.57px] text-rule"
        >
          YANG&apos;S <span className="text-white">FRIED RICE</span>
        </Link>

        <ul className="flex items-start gap-[20px]">
          {NAV_LINKS.map(({ href, label, isCurrent }) => (
            <li key={label}>
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
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-[14px]">
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
      </nav>

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
