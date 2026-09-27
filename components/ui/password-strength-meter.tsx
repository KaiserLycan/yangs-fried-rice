import { passwordStrength, type PasswordStrengthLabel } from "@/lib/profile/password-strength";

/**
 * Color map for each strength tier — the bar fill and the label both use
 * these so they always match.
 */
const STRENGTH_COLORS: Record<PasswordStrengthLabel, { bar: string; text: string }> = {
  Weak:   { bar: "bg-destructive",         text: "text-destructive" },
  Fair:   { bar: "bg-[hsl(30,90%,50%)]",   text: "text-[hsl(30,90%,50%)]" },
  Good:   { bar: "bg-[hsl(80,65%,45%)]",   text: "text-[hsl(80,65%,45%)]" },
  Strong: { bar: "bg-success",             text: "text-success" },
};

/**
 * The bar and word under a new-password field (Cust4). Advice only — it
 * never blocks a submit; the password rule in `lib/validation/login.ts` does
 * that. Draws nothing for an empty field, so an untouched form isn't told
 * its password is "Weak".
 *
 * Shared by the profile's password card and the sign-up form (panel F16),
 * so both judge a password the same way.
 */
export function PasswordStrengthMeter({ password, id }: { password: string; id?: string }) {
  if (!password) return null;
  const strength = passwordStrength(password);
  const colors = STRENGTH_COLORS[strength.label];

  return (
    <div id={id} className="flex items-center gap-[8px] pt-[2px]" aria-live="polite">
      <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-rule" aria-hidden="true">
        <div
          className={`h-full rounded-full ${colors.bar} transition-[width]`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
      <span className={`whitespace-nowrap text-sm font-bold ${colors.text}`}>
        <span className="sr-only">Password strength: </span>
        {strength.label}
      </span>
    </div>
  );
}
