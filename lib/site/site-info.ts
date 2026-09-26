/**
 * The restaurant's own details, for the parts of the app that speak as the
 * business rather than about an order.
 *
 * Everything optional here is `null` on purpose. Issue #106 asks the footer
 * for contact details and social links, and the repository has none: no
 * phone number, no support address, no accounts. Inventing them would put a
 * number nobody answers under "Contact us", which is worse than an honest
 * gap — so the footer renders only what is filled in and drops the rest.
 *
 * Fill these in when the owner supplies them; nothing else needs changing.
 */

export const SITE_NAME = "Yang's Fried Rice";

/** Matches what the manager's PDF reports already print as the letterhead. */
export const SITE_BRANCH = "Malate Branch, Manila";

/** The year the copyright line starts from. */
export const SITE_FOUNDED_YEAR = 2025;

export const SUPPORT_EMAIL: string | null = null;
export const SUPPORT_PHONE: string | null = null;

export type SocialLink = { label: string; href: string };

export const SOCIAL_LINKS: readonly SocialLink[] = [];

/**
 * "2025" on its own, or "2025–2026" once a second year has passed. A footer
 * frozen at the year of the last deploy is a small, constant signal that
 * nobody is home.
 */
export function copyrightYears(now: Date = new Date()): string {
  const current = now.getFullYear();
  return current <= SITE_FOUNDED_YEAR
    ? String(SITE_FOUNDED_YEAR)
    : `${SITE_FOUNDED_YEAR}–${current}`;
}
