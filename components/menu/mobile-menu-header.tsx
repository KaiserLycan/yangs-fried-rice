import { Suspense, use } from "react";
import Link from "next/link";
import { AvatarButton } from "@/components/profile/avatar-button";
import { SearchField } from "@/components/menu/search-field";
import { shortAddressLabel } from "@/lib/profile/address-label";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { initialsFrom } from "@/lib/profile/identity";

function ResolvedMobileProfile({ 
  profile: initialProfile,
  profilePromise 
}: { 
  profile?: CustomerProfile | null;
  profilePromise?: Promise<CustomerProfile | null>;
}) {
  const profile = profilePromise ? use(profilePromise) : (initialProfile ?? null);
  const deliverTo = profile ? shortAddressLabel(profile.deliverToAddress) : "";

  return (
    <div className="flex items-center justify-between w-full">
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
  );
}

export function MobileMenuHeader({
  profile,
  profilePromise,
  search,
  onSearchChange,
}: {
  profile?: CustomerProfile | null;
  profilePromise?: Promise<CustomerProfile | null>;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-[16px] bg-primary px-[20px] pb-[14px] pt-[16px] md:hidden">
      {profilePromise ? (
        <Suspense fallback={
          <div className="flex items-center justify-between w-full">
            <span />
            <div className="size-[38px] animate-pulse rounded-full bg-white/20" />
          </div>
        }>
          <ResolvedMobileProfile profilePromise={profilePromise} />
        </Suspense>
      ) : (
        <ResolvedMobileProfile profile={profile} />
      )}

      <SearchField value={search} onChange={onSearchChange} variant="mobile" />
    </div>
  );
}
