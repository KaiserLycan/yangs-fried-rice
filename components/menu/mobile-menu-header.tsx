import Link from "next/link";
import { AvatarButton } from "@/components/profile/avatar-button";
import { SearchField } from "@/components/menu/search-field";
import { shortAddressLabel } from "@/lib/profile/address-label";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { initialsFrom } from "@/lib/profile/identity";

/**
 * Menu's mobile chrome (`132:96`–`132:105`): "Deliver to", the avatar, and a
 * full-width search field beneath.
 *
 * Kept local to this screen rather than folded into `SiteNavBar`, per that
 * component's own comment — profile's mobile header and this one share
 * nothing but a background colour.
 *
 * `profile` accepts `null` for the same reason `SiteNavBar`'s does: `/menu`
 * is public, so a guest can reach this screen with nobody signed in.
 */
export function MobileMenuHeader({
  profile,
  search,
  onSearchChange,
}: {
  profile: CustomerProfile | null;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const deliverTo = profile ? shortAddressLabel(profile.deliverToAddress) : "";

  return (
    <div className="flex flex-col gap-[16px] bg-primary px-[20px] pb-[14px] pt-[16px] md:hidden">
      <div className="flex items-center justify-between">
        {/* Hidden rather than replaced when there's no address — same call
            SiteNavBar makes, for the same reason. */}
        {deliverTo ? (
          <div className="flex flex-col gap-px">
            <span className="text-[12px] text-background/[0.72]">
              Deliver to
            </span>
            <span className="text-[14px] font-bold text-white">
              {deliverTo} &#9662;
            </span>
          </div>
        ) : (
          <span />
        )}
        {profile ? (
          <AvatarButton
            initials={initialsFrom(profile.name)}
            className="size-[38px] bg-accent text-[13px] font-bold text-white"
          />
        ) : (
          <Link href="/login" className="text-[13px] font-bold text-white">
            Log in
          </Link>
        )}
      </div>

      <SearchField value={search} onChange={onSearchChange} variant="mobile" />
    </div>
  );
}
