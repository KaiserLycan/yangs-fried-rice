/**
 * The strength meter on the password card (Cust4).
 *
 * This is the one piece of logic on the profile screen that is genuinely
 * frontend work rather than a stub — confirmed as approved, client-side
 * only. It advises; it never blocks submission — `newPasswordSchema` does
 * that.
 *
 * The score counts five independent signals rather than trying to model
 * real entropy: long enough to matter, long enough to be comfortable, mixed
 * case, a digit, and a symbol. The scale is coarse on purpose, because a
 * meter that swings on every keystroke reads as noise rather than advice.
 *
 * "Strong" is only ever shown for a password that meets every requirement
 * in `PASSWORD_RULES` — a long password missing its symbol tops out at
 * "Good", so the meter can never call strong a password the form refuses.
 */

import { meetsPasswordRules, PASSWORD_SYMBOL } from "@/lib/validation/fields";

export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export type PasswordStrength = {
  label: PasswordStrengthLabel;
  /** 0–100, how full the meter's bar is drawn. */
  percent: number;
};

const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /[0-9]/;

function scoreOf(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (HAS_LOWER.test(password) && HAS_UPPER.test(password)) score++;
  if (HAS_DIGIT.test(password)) score++;
  if (PASSWORD_SYMBOL.test(password)) score++;
  return score;
}

/**
 * An empty password scores "Weak" at 25%, which is a fact about the input
 * rather than a judgement — callers that don't want to show the meter on an
 * untouched field should check for an empty string themselves rather than
 * this function inventing a fifth "no opinion" state.
 */
export function passwordStrength(password: string): PasswordStrength {
  const score = scoreOf(password);

  if (score <= 1) return { label: "Weak", percent: 25 };
  if (score === 2) return { label: "Fair", percent: 50 };
  if (score === 3 || !meetsPasswordRules(password)) return { label: "Good", percent: 75 };
  return { label: "Strong", percent: 100 };
}
