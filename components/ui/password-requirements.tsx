import { Check, Circle, X } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/validation/fields";

/**
 * Every password requirement listed under a new-password field at once, each
 * ticked off live as the person types — so they see the whole rule up front
 * instead of finding it out one error at a time on submit.
 *
 * Before anything is typed the rules show as plain bullets; after that each
 * one is a green check or a red cross. Reads `PASSWORD_RULES`, the same list
 * `newPasswordSchema` and the strength meter use.
 */
export function PasswordRequirements({ password, id }: { password: string; id?: string }) {
  const touched = password.length > 0;
  const unmet = PASSWORD_RULES.filter((rule) => !rule.test(password)).length;

  return (
    <div id={id} className="pt-[4px]">
      <p className="text-sm font-bold text-muted-foreground">Your password needs:</p>
      <ul className="mt-[4px] grid gap-[2px] text-sm">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          const Icon = !touched ? Circle : met ? Check : X;
          const tone = !touched
            ? "text-muted-foreground"
            : met
              ? "text-success"
              : "text-destructive";
          return (
            <li key={rule.id} className={`flex items-center gap-[6px] ${tone}`}>
              <Icon
                className={!touched ? "h-[6px] w-[6px] fill-current" : "h-[14px] w-[14px]"}
                strokeWidth={3}
                aria-hidden="true"
              />
              <span>
                <span className="sr-only">{!touched ? "" : met ? "Met: " : "Not met: "}</span>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
      {/* One short announcement instead of re-reading the whole list on every keystroke. */}
      <p className="sr-only" aria-live="polite">
        {touched
          ? unmet === 0
            ? "All password requirements met."
            : `${unmet} password requirement${unmet === 1 ? "" : "s"} not met yet.`
          : ""}
      </p>
    </div>
  );
}
