import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { SearchField } from "@/components/menu/search-field";
import { NotificationBell } from "@/components/nav/notification-bell";
import { SITE_BRANCH } from "@/lib/site/site-info";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import { initialsFrom } from "@/lib/profile/identity";

function ResolvedMobileProfile({
  profile: initialProfile,
  profilePromise,
}: {
  profile?: CustomerProfile | null;
  profilePromise?: Promise<CustomerProfile | null>;
}) {
  const [profile, setProfile] = useState<CustomerProfile | null>(
    initialProfile ?? null,
  );
  useEffect(() => {
    if (!profilePromise) {
      setProfile(initialProfile ?? null);
      return;
    }
    let active = true;
    profilePromise.then((next) => {
      if (active) setProfile(next ?? null);
    });
    return () => {
      active = false;
    };
  }, [initialProfile, profilePromise]);
  // Pickup-only (issue #114): this said "Deliver to <address>". What the
  // customer needs to know here is where they will be collecting from.
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-col gap-px">
        <span className="text-sm text-background/[0.8]">Pickup at</span>
        <span className="text-base font-bold text-white">{SITE_BRANCH}</span>
      </div>
      {profile ? (
        <div className="flex items-center gap-[4px]">
          <NotificationBell />
          <Link
            href="/profile"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Go to your account"
          >
            <Avatar
              initials={initialsFrom(profile.name)}
              imageUrl={profile.profileImageUrl}
              className="size-[44px] bg-accent text-sm font-bold text-white"
            />
          </Link>
        </div>
      ) : (
        <Link
          href="/login?next=/menu"
          className="flex min-h-[44px] items-center text-sm font-bold text-white"
        >
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
        <Suspense
          fallback={
            <div className="flex w-full items-center justify-between">
              <span />
              <div className="size-[38px] animate-pulse rounded-full bg-white/20" />
            </div>
          }
        >
          <ResolvedMobileProfile profilePromise={profilePromise} />
        </Suspense>
      ) : (
        <ResolvedMobileProfile profile={profile} />
      )}

      <SearchField value={search} onChange={onSearchChange} variant="mobile" />
    </div>
  );
}
