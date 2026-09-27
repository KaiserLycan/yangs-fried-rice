/**
 * The restaurant's own details, for the parts of the app that speak as the
 * business rather than about an order.
 *
 * Everything optional here may be `null`. Issue #106 asks the footer for
 * contact details and social links; only what the owner has supplied is
 * filled in, and every screen renders only what is filled in and drops the
 * rest — an invented number under "Contact us" is worse than an honest gap.
 */

export const SITE_NAME = "Yang's Fried Rice";
export const SITE_DESCRIPTION = "The best authentic Yangzhou fried rice in Manila. We cook every order fresh, offering quick and easy counter pickup.";

/** Matches what the manager's PDF reports already print as the letterhead. */
export const SITE_BRANCH = "Malate Branch, Manila";

/**
 * The seller, as the Internet Transactions Act (RA 11967) asks every online
 * shop to show it: business name, address and contact (issue #116).
 *
 * TODO(owner): replace with the registered business name and the full street
 * address of the branch. The repository only knows the branch name.
 */
export const SELLER_NAME = SITE_NAME;
export const SELLER_ADDRESS = SITE_BRANCH;

/**
 * Where a customer collects their order. The "ready for pickup" notification
 * is written by a database trigger
 * (`20260928000000_notifications_order_issues_and_realtime.sql`) and spells
 * the same counter out; change both together.
 */
export const PICKUP_COUNTER = "Counter 1";

/** The year the copyright line starts from. */
export const SITE_FOUNDED_YEAR = 2025;

/**
 * The store's contact details, supplied by the owner. Shown on the landing
 * page's contact section, the footer, the store page and the legal pages;
 * the landing page's contact form delivers to SUPPORT_EMAIL.
 */
export const SUPPORT_EMAIL: string | null = "lleyton.flores.482006@gmail.com";
export const SUPPORT_PHONE: string | null = "0962 693 9019";

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

/**
 * Where "Please contact us for a bulk order or catering" leads (issue #115):
 * the landing page's bulk-orders section, which explains that bulk orders
 * are taken by phone and links to the call button and the contact form.
 */
export const BULK_ORDER_CONTACT_HREF = "/#bulk-orders";

/**
 * "Get directions" on the landing page: a Google Maps search for the branch.
 * Built from constants, so nothing a visitor types can change where it goes.
 */
export const DIRECTIONS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE_NAME} ${SELLER_ADDRESS}`,
)}`;
