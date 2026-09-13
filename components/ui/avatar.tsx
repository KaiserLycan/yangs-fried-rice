import { cn } from "@/lib/utils";

/**
 * Initials in a filled circle.
 *
 * Takes the initials already derived rather than a name, so this stays a
 * generic primitive: everything else in `components/ui` depends on nothing
 * but `cn`, and deriving initials here would tie a primitive to the profile
 * feature. `initialsFrom` in `lib/profile/identity.ts` is the other half.
 *
 * There is no photo column yet, so initials are not a fallback here — they
 * are the whole component. When uploads land this grows an image and keeps
 * the initials for customers without one.
 *
 * Size, fill and type are left to the caller because the design genuinely
 * varies them: the nav bar draws a 32px orange circle in bold DM Sans, and
 * the mobile summary card draws a 52px red one in Anton.
 */
export function Avatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      // The initials stand in for the customer's name, which is already on
      // screen beside every instance of this, so there is nothing here for a
      // screen reader to gain from reading it a second time.
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill",
        className,
      )}
    >
      {initials}
    </span>
  );
}
