/**
 * The date line at the top of the order summary — "Aug 30, 6:40 PM" in both
 * frames.
 *
 * There is no order row to read a timestamp from: placing an order is the
 * backend developer's write and is stubbed with a toast, so the only honest
 * value is "now" — the moment the customer is looking at the review screen.
 *
 * Formatted on the server and handed to the screen as a finished string, so
 * the markup React renders on the server is the markup it renders in the
 * browser. Formatting a `new Date()` inside the component would produce two
 * different strings either side of a minute boundary and trip a hydration
 * mismatch.
 */

/**
 * Manila, not the viewer's clock. A Philippine restaurant's order times are
 * Philippine times, and a server rendering in UTC would otherwise print a
 * time eight hours off for everyone.
 */
const RESTAURANT_TIME_ZONE = "Asia/Manila";

export function formatOrderTime(at: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: RESTAURANT_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(at);
}
