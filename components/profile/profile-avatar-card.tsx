import { AvatarButton } from "@/components/profile/avatar-button";

/**
 * Desktop-only. A large avatar sitting to the left of the personal details
 * card, with no card of its own around it.
 *
 * It carried a bordered background originally, matching the other cards on
 * the row. That box was removed in Figma — the circle now sits directly on
 * the page background — so the width Personal Details gives up is picked up
 * by the card growing wider, not by empty space.
 *
 * It has no mobile counterpart because it needs none: at 390px the same
 * avatar is already in the summary card at the top of the page, and a second
 * bare circle would just repeat it.
 */
export function ProfileAvatarCard({ initials }: { initials: string }) {
  return (
    <div className="hidden shrink-0 md:block">
      <AvatarButton
        initials={initials}
        className="size-[140px] bg-primary font-display text-[23px] text-background"
        // Decoration on top of the control, not the control itself.
        wrapperClassName="transition-transform hover:scale-[1.04]"
      />
    </div>
  );
}
