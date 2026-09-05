import { AvatarButton } from "@/components/profile/avatar-button";
import type { CustomerProfile } from "@/lib/profile/customer-profile";
import {
  formatMemberSince,
  formatOrderCount,
  initialsFrom,
} from "@/lib/profile/identity";

/**
 * Mobile-only. It carries the same name, join date and order count the
 * sidebar shows on desktop, which is how the summary reaches a 390px screen
 * where there is no sidebar to put it in. Only one of the two ever renders.
 *
 * The frame places a "Photo" button on the right of this card. It is removed:
 * the avatar itself is the control for changing a photo at both breakpoints,
 * so a separate button would be a second affordance for one action.
 */
export function ProfileSummaryCard({ profile }: { profile: CustomerProfile }) {
  const joined = formatMemberSince(profile.memberSince);
  const orders = formatOrderCount(profile.orderCount);

  return (
    <div className="flex items-center gap-[13px] rounded-sm border border-rule bg-background px-[14px] py-[13px] md:hidden">
      <AvatarButton
        initials={initialsFrom(profile.name)}
        className="size-[52px] bg-primary font-display text-[20px] text-background"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="text-[15px] font-bold text-foreground">{profile.name}</p>
        <p className="text-[12px] text-muted-foreground">
          {joined ? `Member since ${joined} · ${orders}` : orders}
        </p>
      </div>
    </div>
  );
}
