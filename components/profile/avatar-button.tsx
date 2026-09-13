"use client";

import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const CHANGE_PHOTO_TOAST =
  "Changing your photo isn’t available yet. We’re still building it.";

/**
 * The avatar, everywhere it renders on the profile screen, as the control for
 * changing the photo.
 *
 * The frames draw a "Change photo" button on desktop and a "Photo" button on
 * mobile alongside the avatar itself. Both are removed: three affordances for
 * one action is two too many, and the avatar is the one a customer reaches for
 * without being told. The desktop hover-enlarge is decoration layered on top
 * of that, not the affordance — a touch device has no hover, so anything that
 * only appears on hover cannot be how the feature is discovered.
 *
 * There is no photo column and no upload path, so pressing it says so. See
 * `.scratch/profile-page/issues/05-backend-handoff.md`.
 */
export function AvatarButton({
  initials,
  className,
  /** Applied to the button, not the circle — hover growth, mainly. */
  wrapperClassName,
}: {
  initials: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const showToast = useToast();

  return (
    <button
      type="button"
      // `Avatar` is aria-hidden — the initials repeat a name that is already
      // on screen — so the button carries the accessible name instead.
      aria-label="Change your photo"
      onClick={() => showToast(CHANGE_PHOTO_TOAST)}
      className={cn(
        "rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        wrapperClassName,
      )}
    >
      <Avatar initials={initials} className={cn("flex", className)} />
    </button>
  );
}
