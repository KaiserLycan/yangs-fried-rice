import { passwordStrength } from "@/lib/profile/password-strength";

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

  return (
    <div id={id} className="flex items-center gap-[8px] pt-[2px]" aria-live="polite">
      <div className="h-[5px] flex-1 overflow-hidden rounded-pill bg-rule" aria-hidden="true">
        <div
          className="h-full rounded-pill bg-[#3f6b4a] transition-[width]"
          style={{ width: `${strength.percent}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-[14px] font-bold text-[#3f6b4a]">
        <span className="sr-only">Password strength: </span>
        {strength.label}
      </span>
    </div>
  );
}
