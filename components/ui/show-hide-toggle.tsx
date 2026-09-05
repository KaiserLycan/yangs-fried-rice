/**
 * The "Show"/"Hide" control beside a password field's label.
 *
 * Shared because it doesn't actually depend on which field wrapper it sits
 * in — `components/ui/field.tsx` (auth screens) and `components/profile/
 * profile-card.tsx`'s `CardField` (profile screen) both expose the same
 * trailing `action` slot, and this control only ever needs that slot and its
 * own `shown` boolean. Before this, login, sign-up and the profile screen's
 * password card each inlined an identical button.
 */
export function ShowHideToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-[12px] text-primary"
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}
