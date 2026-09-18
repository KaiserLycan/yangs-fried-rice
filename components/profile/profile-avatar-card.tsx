import { AvatarButton } from "@/components/profile/avatar-button";

/**
 * Desktop-only. A large avatar sitting to the left of the personal details
 * card, with no card of its own around it.
 */
export function ProfileAvatarCard({
  initials,
  imageUrl,
}: {
  initials: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="hidden shrink-0 md:block">
      <AvatarButton
        initials={initials}
        imageUrl={imageUrl}
        className="size-[140px] bg-primary font-display text-[23px] text-background"
        wrapperClassName="transition-transform hover:scale-[1.04] size-[140px]"
      />
    </div>
  );
}
