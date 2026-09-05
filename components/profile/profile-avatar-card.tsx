import { AvatarButton } from "@/components/profile/avatar-button";

/**
 * Desktop-only. A 260px card holding nothing but a large avatar, sitting to
 * the left of the personal details card.
 *
 * It has no mobile counterpart because it needs none: at 390px the same
 * avatar is already in the summary card at the top of the page, and a second
 * card containing one circle would be a screenful of nothing.
 */
export function ProfileAvatarCard({ initials }: { initials: string }) {
  return (
    <div className="hidden h-[141px] w-[260px] shrink-0 items-center rounded-sm border border-rule bg-background px-[18px] py-[16px] md:flex">
      <AvatarButton
        initials={initials}
        className="size-[108px] bg-primary font-display text-[23px] text-background"
        // Decoration on top of the control, not the control itself.
        wrapperClassName="transition-transform hover:scale-[1.04]"
      />
    </div>
  );
}
